import { create } from 'zustand';
import type { AppState, UsageLog, Child } from '../types';
import { MAX_SESSION_MINUTES, DEFAULT_PIN } from '../types';
import { StorageService } from '../services/storage';
import { msToMinutes, calculateRemainingMinutes } from '../utils/time';

interface AppStore extends AppState {
  // UI State
  isParentMode: boolean;
  isRunning: boolean;
  elapsedSeconds: number;
  error: string | null;
  toastMessage: string | null;
  pinAttempts: number;
  pinLockedUntil: number; // Epoch ms, 0 = not locked

  // Actions
  initialize: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;

  // 子供管理
  selectChild: (childId: string | null) => void;
  addChild: (name: string) => Promise<void>;
  updateChildName: (childId: string, name: string) => Promise<void>;
  getSelectedChild: () => Child | null;

  // 時間管理（選択中の子供に対して操作）
  grantMinutes: (minutes: number) => Promise<void>;
  startGame: () => Promise<boolean>;
  stopGame: () => Promise<void>;
  resetTime: () => Promise<void>;

  enterParentMode: (pin: string) => boolean;
  exitParentMode: () => void;
  resetPinAttempts: () => void;

  // Timer
  tick: () => void;

  // Persistence
  saveState: () => Promise<void>;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<boolean>;

  // UI
  setError: (error: string | null) => void;
  showToast: (message: string) => void;
  clearToast: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial State
  pin: DEFAULT_PIN,
  children: [],
  selectedChildId: null,
  version: 2,
  isParentMode: false,
  isRunning: false,
  elapsedSeconds: 0,
  error: null,
  toastMessage: null,
  pinAttempts: 0,
  pinLockedUntil: 0,

  // アプリ初期化
  initialize: async () => {
    const state = await StorageService.load();
    if (state) {
      // 選択中の子供の実行中状態を復元
      const selectedChild = state.children.find(c => c.id === state.selectedChildId);
      const isRunning = selectedChild ? selectedChild.startTimestamp > 0 : false;
      let elapsedSeconds = 0;

      if (isRunning && selectedChild) {
        const elapsedMs = Date.now() - selectedChild.startTimestamp;
        elapsedSeconds = Math.floor(elapsedMs / 1000);
      }

      set({
        pin: state.pin,
        children: state.children,
        selectedChildId: state.selectedChildId,
        version: state.version,
        isRunning,
        elapsedSeconds
      });
    }
  },

  // PIN設定
  setPin: async (newPin: string) => {
    set({ pin: newPin });
    await get().saveState();
  },

  // 子供選択
  selectChild: (childId: string | null) => {
    if (childId === null) {
      // 選択をクリア
      set({
        selectedChildId: null,
        isRunning: false,
        elapsedSeconds: 0
      });
      get().saveState();
      return;
    }

    const child = get().children.find(c => c.id === childId);
    if (child) {
      const isRunning = child.startTimestamp > 0;
      let elapsedSeconds = 0;

      if (isRunning) {
        const elapsedMs = Date.now() - child.startTimestamp;
        elapsedSeconds = Math.floor(elapsedMs / 1000);
      }

      set({
        selectedChildId: childId,
        isRunning,
        elapsedSeconds
      });
      get().saveState();
    }
  },

  // 子供追加
  addChild: async (name: string) => {
    const children = get().children;
    if (children.length >= 2) {
      get().setError('子供は最大2名までです');
      return;
    }

    const newChild: Child = {
      id: `child-${Date.now()}`,
      name,
      remainingMinutes: 0,
      startTimestamp: 0
    };

    set({
      children: [...children, newChild],
      selectedChildId: newChild.id,
      isRunning: false,
      elapsedSeconds: 0
    });
    await get().saveState();
    get().showToast(`${name}を追加しました`);
  },

  // 子供の名前更新
  updateChildName: async (childId: string, name: string) => {
    const children = get().children.map(c =>
      c.id === childId ? { ...c, name } : c
    );
    set({ children });
    await get().saveState();
    get().showToast('名前を変更しました');
  },

  // 選択中の子供を取得
  getSelectedChild: () => {
    const { children, selectedChildId } = get();
    return children.find(c => c.id === selectedChildId) || null;
  },

  // 時間付与
  grantMinutes: async (minutes: number) => {
    const selectedChild = get().getSelectedChild();
    if (!selectedChild) {
      get().setError('子供が選択されていません');
      return;
    }

    const children = get().children.map(c =>
      c.id === selectedChild.id
        ? { ...c, remainingMinutes: c.remainingMinutes + minutes }
        : c
    );

    set({ children });
    await get().saveState();

    // ログ記録
    const log: UsageLog = {
      id: `grant_${Date.now()}`,
      childId: selectedChild.id,
      start: Date.now(),
      end: Date.now(),
      duration: 0,
      type: 'grant',
      amount: minutes,
      note: `付与: +${minutes}分`
    };
    await StorageService.addLog(log);

    get().showToast(`+${minutes}分 付与しました`);
  },

  // ゲーム開始
  startGame: async () => {
    const selectedChild = get().getSelectedChild();
    if (!selectedChild) {
      get().setError('子供が選択されていません');
      return false;
    }

    if (get().isRunning) {
      get().setError('既にゲーム中です');
      return false;
    }

    if (selectedChild.remainingMinutes <= 0) {
      get().setError('残り時間がありません');
      return false;
    }

    const startTimestamp = Date.now();
    const children = get().children.map(c =>
      c.id === selectedChild.id
        ? { ...c, startTimestamp }
        : c
    );

    set({
      children,
      isRunning: true,
      elapsedSeconds: 0,
      error: null
    });

    await get().saveState();
    return true;
  },

  // ゲーム終了
  stopGame: async () => {
    const selectedChild = get().getSelectedChild();
    if (!selectedChild || selectedChild.startTimestamp === 0) {
      return;
    }

    const elapsedMs = Date.now() - selectedChild.startTimestamp;
    let elapsedMinutes = msToMinutes(elapsedMs);

    // 最大セッション時間制限
    if (elapsedMinutes > MAX_SESSION_MINUTES) {
      elapsedMinutes = MAX_SESSION_MINUTES;
      get().showToast('最大2時間で自動終了しました');
    }

    const newRemainingMinutes = Math.max(0, selectedChild.remainingMinutes - elapsedMinutes);

    const children = get().children.map(c =>
      c.id === selectedChild.id
        ? { ...c, startTimestamp: 0, remainingMinutes: newRemainingMinutes }
        : c
    );

    set({
      children,
      isRunning: false,
      elapsedSeconds: 0
    });

    await get().saveState();

    // ログ記録
    const log: UsageLog = {
      id: `consume_${Date.now()}`,
      childId: selectedChild.id,
      start: selectedChild.startTimestamp,
      end: Date.now(),
      duration: elapsedMinutes,
      type: 'consume',
      amount: -elapsedMinutes,
      note: `消費: -${elapsedMinutes}分`
    };
    await StorageService.addLog(log);
  },

  // 時間リセット
  resetTime: async () => {
    const selectedChild = get().getSelectedChild();
    if (!selectedChild) {
      get().setError('子供が選択されていません');
      return;
    }

    const children = get().children.map(c =>
      c.id === selectedChild.id
        ? { ...c, remainingMinutes: 0, startTimestamp: 0 }
        : c
    );

    set({
      children,
      isRunning: false,
      elapsedSeconds: 0
    });

    await get().saveState();
    get().showToast('時間をリセットしました');
  },

  // 親モード入室
  enterParentMode: (inputPin: string) => {
    const { pin, pinAttempts, pinLockedUntil } = get();

    // ロック中チェック
    if (pinLockedUntil > 0 && Date.now() < pinLockedUntil) {
      const remainingSeconds = Math.ceil((pinLockedUntil - Date.now()) / 1000);
      get().setError(`${remainingSeconds}秒後に再試行してください`);
      return false;
    }

    // ロック解除
    if (pinLockedUntil > 0 && Date.now() >= pinLockedUntil) {
      set({ pinLockedUntil: 0, pinAttempts: 0 });
    }

    // PIN照合
    if (inputPin === pin) {
      set({ isParentMode: true, error: null, pinAttempts: 0, pinLockedUntil: 0 });
      return true;
    }

    // 失敗回数をカウント
    const newAttempts = pinAttempts + 1;

    if (newAttempts >= 5) {
      // 5回失敗でロック
      const lockUntil = Date.now() + 30000; // 30秒
      set({
        pinAttempts: 0,
        pinLockedUntil: lockUntil
      });
      get().setError('5回失敗しました。30秒後に再試行してください');
    } else {
      set({ pinAttempts: newAttempts });
      get().setError(`PINが正しくありません（${newAttempts}/5回）`);
    }
    return false;
  },

  // 親モード退室
  exitParentMode: () => {
    set({ isParentMode: false, error: null, pinAttempts: 0 });
  },

  // PIN試行回数リセット
  resetPinAttempts: () => {
    set({ pinAttempts: 0, pinLockedUntil: 0, error: null });
  },

  // タイマーティック（1秒ごと）
  tick: () => {
    const { isRunning } = get();
    const selectedChild = get().getSelectedChild();

    if (!isRunning || !selectedChild || selectedChild.startTimestamp === 0) {
      return;
    }

    const actualElapsedSeconds = Math.floor((Date.now() - selectedChild.startTimestamp) / 1000);

    // 残り時間チェック
    const currentRemaining = calculateRemainingMinutes(
      selectedChild.remainingMinutes,
      selectedChild.startTimestamp,
      MAX_SESSION_MINUTES
    );

    if (currentRemaining <= 0 || actualElapsedSeconds >= MAX_SESSION_MINUTES * 60) {
      // 自動終了
      get().stopGame();
      return;
    }

    set({ elapsedSeconds: actualElapsedSeconds });
  },

  // 状態保存
  saveState: async () => {
    const { pin, children, selectedChildId, version } = get();
    const state: AppState = {
      pin,
      children,
      selectedChildId,
      version
    };
    await StorageService.save(state);
  },

  // データエクスポート
  exportData: async () => {
    return await StorageService.export();
  },

  // データインポート
  importData: async (json: string) => {
    try {
      const success = await StorageService.import(json);
      if (success) {
        await get().initialize();
        get().showToast('データを復元しました');
      }
      return success;
    } catch (error) {
      if (error instanceof Error) {
        get().setError(error.message);
      } else {
        get().setError('インポートに失敗しました');
      }
      return false;
    }
  },

  // エラー設定
  setError: (error: string | null) => {
    set({ error });
  },

  // トースト表示
  showToast: (message: string) => {
    set({ toastMessage: message });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 3000);
  },

  // トーストクリア
  clearToast: () => {
    set({ toastMessage: null });
  }
}));

// Page Visibility API による状態保存
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      useAppStore.getState().saveState();
    }
  });
}

// タイマー（1秒ごと）
if (typeof window !== 'undefined') {
  setInterval(() => {
    useAppStore.getState().tick();
  }, 1000);
}

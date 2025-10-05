import { create } from 'zustand';
import type { AppState, UsageLog } from '../types';
import { APP_VERSION, MAX_SESSION_MINUTES, DEFAULT_PIN } from '../types';
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
  remainingMinutes: 0,
  startTimestamp: 0,
  version: APP_VERSION,
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
      // 実行中状態の復元
      const isRunning = state.startTimestamp > 0;
      let elapsedSeconds = 0;

      if (isRunning) {
        const elapsedMs = Date.now() - state.startTimestamp;
        elapsedSeconds = Math.floor(elapsedMs / 1000);
      }

      set({
        pin: state.pin,
        remainingMinutes: state.remainingMinutes,
        startTimestamp: state.startTimestamp,
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

  // 時間付与
  grantMinutes: async (minutes: number) => {
    const currentMinutes = get().remainingMinutes;
    const newMinutes = currentMinutes + minutes;

    set({ remainingMinutes: newMinutes });
    await get().saveState();

    // ログ記録
    const log: UsageLog = {
      id: `grant_${Date.now()}`,
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
    const { remainingMinutes, isRunning } = get();

    if (isRunning) {
      get().setError('既にゲーム中です');
      return false;
    }

    if (remainingMinutes <= 0) {
      get().setError('残り時間がありません');
      return false;
    }

    const startTimestamp = Date.now();
    set({
      startTimestamp,
      isRunning: true,
      elapsedSeconds: 0,
      error: null
    });

    await get().saveState();
    return true;
  },

  // ゲーム終了
  stopGame: async () => {
    const { startTimestamp, remainingMinutes } = get();

    if (startTimestamp === 0) {
      return;
    }

    const elapsedMs = Date.now() - startTimestamp;
    let elapsedMinutes = msToMinutes(elapsedMs);

    // 最大セッション時間制限
    if (elapsedMinutes > MAX_SESSION_MINUTES) {
      elapsedMinutes = MAX_SESSION_MINUTES;
      get().showToast('最大2時間で自動終了しました');
    }

    const newRemainingMinutes = Math.max(0, remainingMinutes - elapsedMinutes);

    set({
      startTimestamp: 0,
      remainingMinutes: newRemainingMinutes,
      isRunning: false,
      elapsedSeconds: 0
    });

    await get().saveState();

    // ログ記録
    const log: UsageLog = {
      id: `consume_${Date.now()}`,
      start: startTimestamp,
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
    set({ remainingMinutes: 0, startTimestamp: 0, isRunning: false, elapsedSeconds: 0 });
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
    const { isRunning, startTimestamp, remainingMinutes } = get();

    if (!isRunning || startTimestamp === 0) {
      return;
    }

    const actualElapsedSeconds = Math.floor((Date.now() - startTimestamp) / 1000);

    // 残り時間チェック
    const currentRemaining = calculateRemainingMinutes(
      remainingMinutes,
      startTimestamp,
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
    const { pin, remainingMinutes, startTimestamp, version } = get();
    const state: AppState = {
      pin,
      remainingMinutes,
      startTimestamp,
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

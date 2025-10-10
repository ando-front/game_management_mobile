import Dexie, { Table } from 'dexie';
import type { AppState, UsageLog, BackupData, Child } from '../types';
import { APP_VERSION, DEFAULT_PIN } from '../types';

// IndexedDB定義
class GameTimeDB extends Dexie {
  appState!: Table<AppState & { id: number }, number>;
  usageLogs!: Table<UsageLog, string>;

  constructor() {
    super('GameTimeDB');
    // version 2: 複数子供対応
    this.version(2).stores({
      appState: '++id, version',
      usageLogs: 'id, childId, start, end, type'
    }).upgrade(async (trans) => {
      // マイグレーション処理
      const oldState = await trans.table('appState').get(1) as any;
      if (oldState && !oldState.children) {
        // 旧データを新しい構造に変換
        const defaultChild: Child = {
          id: 'child-1',
          name: 'こども1',
          remainingMinutes: oldState.remainingMinutes || 0,
          startTimestamp: oldState.startTimestamp || 0
        };

        const newState: AppState = {
          pin: oldState.pin || DEFAULT_PIN,
          children: [defaultChild],
          selectedChildId: 'child-1',
          version: 2
        };

        await trans.table('appState').clear();
        await trans.table('appState').add({ ...newState, id: 1 });

        // 既存のログにchildIdを追加
        const logs = await trans.table('usageLogs').toArray();
        for (const log of logs) {
          if (!log.childId) {
            await trans.table('usageLogs').update(log.id, { childId: 'child-1' });
          }
        }
      }
    });

    // version 1: 初期バージョン（後方互換性のため残す）
    this.version(1).stores({
      appState: '++id, version',
      usageLogs: 'id, start, end, type'
    });
  }
}

const db = new GameTimeDB();

// デフォルト状態
const defaultAppState: AppState = {
  pin: DEFAULT_PIN,
  children: [],
  selectedChildId: null,
  version: 2
};

/**
 * StorageService
 * 詳細設計書 セクション11.1に基づく
 */
export class StorageService {
  /**
   * アプリ状態を保存
   */
  static async save(state: AppState): Promise<void> {
    try {
      // 既存レコードを削除して新しいものを挿入（単一レコード保証）
      await db.appState.clear();
      await db.appState.add({ ...state, id: 1 });
    } catch (error) {
      console.error('Failed to save app state:', error);
      throw new Error('データの保存に失敗しました');
    }
  }

  /**
   * アプリ状態を読み込み
   */
  static async load(): Promise<AppState | null> {
    try {
      const state = await db.appState.get(1);
      if (!state) {
        // 初回起動時はデフォルト状態を保存
        await this.save(defaultAppState);
        return defaultAppState;
      }

      // 新しいデータ構造を返す
      return {
        pin: state.pin,
        children: state.children || [],
        selectedChildId: state.selectedChildId || null,
        version: state.version
      };
    } catch (error) {
      console.error('Failed to load app state:', error);
      // エラー時はデフォルト値を返す
      return defaultAppState;
    }
  }

  /**
   * 利用ログを追加
   */
  static async addLog(log: UsageLog): Promise<void> {
    try {
      await db.usageLogs.add(log);

      // ログのローテーション（直近100件のみ保持）
      const count = await db.usageLogs.count();
      if (count > 100) {
        const oldLogs = await db.usageLogs
          .orderBy('start')
          .limit(count - 100)
          .toArray();
        const oldIds = oldLogs.map(log => log.id);
        await db.usageLogs.bulkDelete(oldIds);
      }
    } catch (error) {
      console.error('Failed to add usage log:', error);
    }
  }

  /**
   * 利用ログを取得
   * @param limit 取得件数
   * @param childId 子供ID（指定された場合、その子供の履歴のみ取得）
   */
  static async getLogs(limit: number = 10, childId?: string): Promise<UsageLog[]> {
    try {
      let query = db.usageLogs.orderBy('start').reverse();

      if (childId) {
        // 特定の子供の履歴のみフィルタ
        const allLogs = await query.toArray();
        return allLogs.filter(log => log.childId === childId).slice(0, limit);
      }

      return await query.limit(limit).toArray();
    } catch (error) {
      console.error('Failed to get usage logs:', error);
      return [];
    }
  }

  /**
   * JSONエクスポート
   */
  static async export(): Promise<string> {
    try {
      const appState = await this.load();
      const usageLogs = await db.usageLogs.toArray();

      if (!appState) {
        throw new Error('データが見つかりません');
      }

      const backupData: BackupData = {
        appState,
        usageLogs,
        exportedAt: Date.now(),
        version: APP_VERSION
      };

      return JSON.stringify(backupData, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('エクスポートに失敗しました');
    }
  }

  /**
   * JSONインポート
   */
  static async import(jsonString: string): Promise<boolean> {
    try {
      const backupData: BackupData = JSON.parse(jsonString);

      // バリデーション
      if (!backupData.appState || !backupData.version) {
        throw new Error('無効なデータ形式です');
      }

      if (backupData.version > APP_VERSION) {
        throw new Error('新しいバージョンのデータです。アプリを更新してください');
      }

      // データを復元
      await this.save(backupData.appState);
      await db.usageLogs.clear();
      if (backupData.usageLogs && backupData.usageLogs.length > 0) {
        await db.usageLogs.bulkAdd(backupData.usageLogs);
      }

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('インポートに失敗しました');
    }
  }

  /**
   * 全データを削除（リセット用）
   */
  static async clear(): Promise<void> {
    try {
      await db.appState.clear();
      await db.usageLogs.clear();
      await this.save(defaultAppState);
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw new Error('データの削除に失敗しました');
    }
  }
}

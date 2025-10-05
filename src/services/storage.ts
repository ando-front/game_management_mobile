import Dexie, { Table } from 'dexie';
import type { AppState, UsageLog, BackupData } from '../types';
import { APP_VERSION, DEFAULT_PIN } from '../types';

// IndexedDB定義
class GameTimeDB extends Dexie {
  appState!: Table<AppState & { id: number }, number>;
  usageLogs!: Table<UsageLog, string>;

  constructor() {
    super('GameTimeDB');
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
  remainingMinutes: 0,
  startTimestamp: 0,
  version: APP_VERSION
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
      return {
        pin: state.pin,
        remainingMinutes: state.remainingMinutes,
        startTimestamp: state.startTimestamp,
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
   */
  static async getLogs(limit: number = 10): Promise<UsageLog[]> {
    try {
      return await db.usageLogs
        .orderBy('start')
        .reverse()
        .limit(limit)
        .toArray();
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

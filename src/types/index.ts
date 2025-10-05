// データモデル（詳細設計書 セクション2に基づく）

export interface AppState {
  pin: string;
  remainingMinutes: number;
  startTimestamp: number; // 0 = not running, otherwise Epoch ms
  version: number;
}

export interface UsageLog {
  id: string;
  start: number; // Epoch ms
  end: number; // Epoch ms
  duration: number; // 分
  type: 'consume' | 'grant';
  amount: number; // 分（grant のとき +、consume のとき -）
  note?: string;
}

// UIステート
export interface UIState {
  isParentMode: boolean;
  isRunning: boolean;
  elapsedSeconds: number;
}

// バックアップデータ形式
export interface BackupData {
  appState: AppState;
  usageLogs: UsageLog[];
  exportedAt: number; // Epoch ms
  version: number;
}

// 定数
export const APP_VERSION = 1;
export const MAX_SESSION_MINUTES = 120;
export const DEFAULT_PIN = '0000';
export const LONG_PRESS_DURATION = 500; // ms
export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LOCKOUT_DURATION = 30000; // 30秒

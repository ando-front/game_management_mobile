/**
 * 時間関連のユーティリティ関数
 */

/**
 * 分を「X時間Y分」形式にフォーマット
 */
export function formatMinutes(minutes: number): string {
  if (minutes === 0) return '0 分';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} 分`;
  }
  if (mins === 0) {
    return `${hours} 時間`;
  }
  return `${hours} 時間 ${mins} 分`;
}

/**
 * 秒を「HH:MM:SS」形式にフォーマット
 */
export function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

/**
 * ミリ秒を分に変換（1分単位で丸め）
 */
export function msToMinutes(ms: number): number {
  return Math.round(ms / 60000);
}

/**
 * 経過時間から残り時間を計算
 */
export function calculateRemainingMinutes(
  initialMinutes: number,
  startTimestamp: number,
  maxMinutes: number = 120
): number {
  if (startTimestamp === 0) {
    return initialMinutes;
  }

  const elapsedMs = Date.now() - startTimestamp;
  const elapsedMinutes = Math.min(msToMinutes(elapsedMs), maxMinutes);

  return Math.max(0, initialMinutes - elapsedMinutes);
}

/**
 * バックアップファイル名を生成
 */
export function generateBackupFileName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');

  return `game-time-backup_${year}-${month}-${day}.json`;
}

/**
 * 日時をフォーマット（YYYY/MM/DD HH:MM）
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

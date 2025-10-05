/**
 * バリデーション関数
 * 詳細設計書 セクション12.1に基づく
 */

/**
 * PINが有効か検証（4桁の数字）
 */
export function validatePin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/**
 * 分数が有効範囲内か検証
 */
export function validateMinutes(minutes: number, min: number = 0, max: number = 999): boolean {
  return Number.isInteger(minutes) && minutes >= min && minutes <= max;
}

/**
 * バリデーションエラーメッセージ
 */
export const ValidationMessages = {
  PIN_INVALID: '4桁の数字を入力してください',
  PIN_MISMATCH: 'PINが一致しません',
  MINUTES_INVALID: (min: number, max: number) => `${min}〜${max}分の範囲で入力してください`,
  NO_TIME_REMAINING: '残り時間がありません',
  DATA_FORMAT_INVALID: 'データ形式が正しくありません',
  MAX_SESSION_EXCEEDED: '最大2時間で自動終了します'
} as const;

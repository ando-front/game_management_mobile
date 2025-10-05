import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { formatMinutes, formatSeconds, calculateRemainingMinutes } from '../../utils/time';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import { MAX_SESSION_MINUTES } from '../../types';

export const ChildHome: React.FC = () => {
  const {
    remainingMinutes,
    startTimestamp,
    isRunning,
    elapsedSeconds,
    startGame,
    stopGame
  } = useAppStore();

  const [showStopDialog, setShowStopDialog] = React.useState(false);

  // 現在の残り時間を計算
  const currentRemaining = isRunning
    ? calculateRemainingMinutes(remainingMinutes, startTimestamp, MAX_SESSION_MINUTES)
    : remainingMinutes;

  const handleStart = async () => {
    const success = await startGame();
    if (!success) {
      // エラーは useAppStore で設定される
    }
  };

  const handleStopConfirm = async () => {
    await stopGame();
    setShowStopDialog(false);
  };

  const handleParentMode = () => {
    // 親モードへの切り替えリクエスト（PIN入力を促す）
    // App.tsx で showPinInput を管理
    window.dispatchEvent(new CustomEvent('requestParentMode'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col">
      {/* ヘッダー */}
      <header className="p-4 text-center">
        <h1 className="text-2xl font-bold text-indigo-900">
          {isRunning ? '🎮 ゲーム中' : '🎮 ゲーム時間'}
        </h1>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-8">
        {/* 残り時間表示 */}
        <div className="text-center">
          <p className="text-gray-600 mb-2">残り時間</p>
          <div className="text-6xl font-bold text-indigo-600">
            {formatMinutes(currentRemaining)}
          </div>
        </div>

        {/* 経過時間表示（実行中のみ） */}
        {isRunning && (
          <div className="text-center">
            <p className="text-gray-500 text-sm">経過</p>
            <div className="text-3xl font-mono text-gray-700">
              {formatSeconds(elapsedSeconds)}
              <span className="text-sm ml-2 text-gray-500">（目安表示）</span>
            </div>
          </div>
        )}

        {/* メインボタン */}
        <div className="w-full max-w-md">
          {!isRunning ? (
            <Button
              size="large"
              onClick={handleStart}
              disabled={currentRemaining <= 0}
            >
              ゲームをはじめる
            </Button>
          ) : (
            <Button
              size="large"
              variant="danger"
              onLongPress={() => setShowStopDialog(true)}
            >
              長押しで終了する
            </Button>
          )}
        </div>

        {/* 時間切れメッセージ */}
        {!isRunning && currentRemaining <= 0 && (
          <div className="text-center text-gray-600">
            <p>残り時間がありません</p>
            <p className="text-sm">親に相談してください</p>
          </div>
        )}

        {/* 状態表示 */}
        <div className="text-center text-sm text-gray-500">
          状態: {isRunning ? `実行中（開始: ${new Date(startTimestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}）` : '待機中'}
        </div>
      </div>

      {/* フッター */}
      <footer className="p-4 text-right">
        <button
          onClick={handleParentMode}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          親モード →
        </button>
      </footer>

      {/* 終了確認ダイアログ */}
      <Dialog
        isOpen={showStopDialog}
        onClose={() => setShowStopDialog(false)}
        title="ゲームを終了しますか？"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowStopDialog(false)}>
              キャンセル
            </Button>
            <Button variant="danger" onClick={handleStopConfirm}>
              終了する
            </Button>
          </>
        }
      >
        <p>経過時間が残り時間から引かれます。</p>
      </Dialog>
    </div>
  );
};

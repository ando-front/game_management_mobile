import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { formatMinutes, formatSeconds, calculateRemainingMinutes } from '../../utils/time';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import { UsageHistory } from './UsageHistory';
import { MAX_SESSION_MINUTES } from '../../types';

export const ChildHome: React.FC = () => {
  const {
    children,
    getSelectedChild,
    selectChild,
    isRunning,
    elapsedSeconds,
    startGame,
    stopGame
  } = useAppStore();

  const [showStopDialog, setShowStopDialog] = React.useState(false);
  const [showChildSelector, setShowChildSelector] = React.useState(false);
  const selectedChild = getSelectedChild();

  // 選択中の子供がいない場合は何も表示しない
  if (!selectedChild) {
    return null;
  }

  // 現在の残り時間を計算
  const currentRemaining = isRunning
    ? calculateRemainingMinutes(selectedChild.remainingMinutes, selectedChild.startTimestamp, MAX_SESSION_MINUTES)
    : selectedChild.remainingMinutes;

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

  const handleSelectChild = (childId: string) => {
    selectChild(childId);
    setShowChildSelector(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col">
      {/* ヘッダー */}
      <header className="p-4">
        <div className="flex items-center justify-between mb-2">
          {children.length > 1 && (
            <button
              onClick={() => setShowChildSelector(true)}
              className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg text-indigo-900 font-medium transition-colors"
            >
              切り替え
            </button>
          )}
          <div className="flex-1"></div>
        </div>
        <h1 className="text-2xl font-bold text-indigo-900 text-center">
          {isRunning ? `🎮 ${selectedChild.name}の ゲーム中` : `🎮 ${selectedChild.name}の ゲーム時間`}
        </h1>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center px-6 space-y-6 overflow-y-auto pb-20">
        <div className="flex-shrink-0 space-y-8 pt-8">
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
          状態: {isRunning ? `実行中（開始: ${new Date(selectedChild.startTimestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}）` : '待機中'}
        </div>
        </div>

        {/* 利用履歴 */}
        <div className="w-full max-w-md">
          <UsageHistory />
        </div>
      </div>

      {/* フッター */}
      <footer className="p-6">
        <Button
          variant="secondary"
          onClick={handleParentMode}
          className="w-full"
        >
          👨‍👩‍👧‍👦 親モード
        </Button>
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

      {/* 子供選択ダイアログ */}
      <Dialog
        isOpen={showChildSelector}
        onClose={() => setShowChildSelector(false)}
        title="だれの じかん？"
        actions={
          <Button variant="secondary" onClick={() => setShowChildSelector(false)}>
            キャンセル
          </Button>
        }
      >
        <div className="space-y-3">
          {children.map((child) => (
            <Button
              key={child.id}
              size="large"
              variant={child.id === selectedChild.id ? 'primary' : 'secondary'}
              onClick={() => handleSelectChild(child.id)}
              className="w-full"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xl">{child.name}</span>
                <span className="text-sm opacity-70">
                  {formatMinutes(child.remainingMinutes)} のこり
                </span>
              </div>
            </Button>
          ))}
        </div>
      </Dialog>
    </div>
  );
};

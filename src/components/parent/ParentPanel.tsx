import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { formatMinutes } from '../../utils/time';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import { PinSettings } from './PinSettings';
import { DataManagement } from './DataManagement';

export const ParentPanel: React.FC = () => {
  const {
    remainingMinutes,
    grantMinutes,
    resetTime,
    exitParentMode
  } = useAppStore();

  const [showResetDialog, setShowResetDialog] = React.useState(false);

  const handleGrant = (minutes: number) => {
    grantMinutes(minutes);
  };

  const handleResetConfirm = async () => {
    await resetTime();
    setShowResetDialog(false);
  };

  const handleBackToChild = () => {
    exitParentMode();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col">
      {/* ヘッダー */}
      <header className="p-4 text-center border-b border-purple-100">
        <h1 className="text-2xl font-bold text-purple-900">👨‍👩‍👧‍👦 親モード</h1>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-8">
        {/* 現在の残り時間 */}
        <div className="text-center">
          <p className="text-gray-600 mb-2">現在の残り時間</p>
          <div className="text-5xl font-bold text-purple-600">
            {formatMinutes(remainingMinutes)}
          </div>
        </div>

        {/* 時間付与プリセット */}
        <div className="w-full max-w-md">
          <p className="text-gray-700 mb-3 text-center font-medium">時間を付与</p>
          <div className="grid grid-cols-3 gap-3">
            <Button onClick={() => handleGrant(5)}>+5分</Button>
            <Button onClick={() => handleGrant(10)}>+10分</Button>
            <Button onClick={() => handleGrant(15)}>+15分</Button>
          </div>
        </div>

        {/* リセット */}
        <div className="w-full max-w-md">
          <Button
            size="large"
            variant="danger"
            onClick={() => setShowResetDialog(true)}
          >
            時間をリセット
          </Button>
        </div>

        {/* 設定・管理 */}
        <div className="w-full max-w-md">
          <p className="text-gray-700 mb-3 text-center font-medium">設定・管理</p>
          <div className="grid grid-cols-2 gap-3">
            <PinSettings />
            <DataManagement />
          </div>
        </div>
      </div>

      {/* フッター */}
      <footer className="p-4 text-right">
        <button
          onClick={handleBackToChild}
          className="text-purple-600 hover:text-purple-800 font-medium"
        >
          子供モードへ →
        </button>
      </footer>

      {/* リセット確認ダイアログ */}
      <Dialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        title="時間をリセットしますか？"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowResetDialog(false)}>
              キャンセル
            </Button>
            <Button variant="danger" onClick={handleResetConfirm}>
              リセット
            </Button>
          </>
        }
      >
        <p>残り時間が0分になります。この操作は取り消せません。</p>
      </Dialog>
    </div>
  );
};

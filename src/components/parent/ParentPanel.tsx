import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { formatMinutes, generateBackupFileName } from '../../utils/time';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';

export const ParentPanel: React.FC = () => {
  const {
    remainingMinutes,
    grantMinutes,
    resetTime,
    exitParentMode,
    exportData,
    importData
  } = useAppStore();

  const [showResetDialog, setShowResetDialog] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleGrant = (minutes: number) => {
    grantMinutes(minutes);
  };

  const handleResetConfirm = async () => {
    await resetTime();
    setShowResetDialog(false);
  };

  const handleExport = async () => {
    try {
      const jsonData = await exportData();
      const fileName = generateBackupFileName();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importData(text);
    } catch (error) {
      console.error('Import failed:', error);
    }

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

        {/* バックアップ */}
        <div className="w-full max-w-md">
          <p className="text-gray-700 mb-3 text-center font-medium">バックアップ</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={handleExport}>
              エクスポート
            </Button>
            <Button variant="secondary" onClick={handleImportClick}>
              インポート
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
          <p className="text-xs text-gray-500 mt-2 text-center">
            推奨: 月1回、または大きな変更後<br />
            保存先: iCloud Drive（ファイルアプリ）
          </p>
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

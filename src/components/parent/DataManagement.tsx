import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { StorageService } from '../../services/storage';
import { formatDateTime } from '../../utils/time';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import type { UsageLog } from '../../types';

export const DataManagement: React.FC = () => {
  const { exportData, importData } = useAppStore();

  const [isOpen, setIsOpen] = React.useState(false);
  const [logs, setLogs] = React.useState<UsageLog[]>([]);
  const [lastExport, setLastExport] = React.useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ログを読み込み
  React.useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const loadLogs = async () => {
    const recentLogs = await StorageService.getLogs(10);
    setLogs(recentLogs);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleExport = async () => {
    try {
      const jsonData = await exportData();
      const fileName = `game-time-backup_${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      setLastExport(Date.now());
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
      const success = await importData(text);
      if (success) {
        await loadLogs(); // ログを再読み込み
      }
    } catch (error) {
      console.error('Import failed:', error);
    }

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={handleOpen}>
        データ管理
      </Button>

      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title="💾 データ管理"
        actions={
          <Button variant="secondary" onClick={handleClose}>
            閉じる
          </Button>
        }
      >
        <div className="space-y-6">
          {/* バックアップ */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">バックアップ</h3>
            <Button size="medium" onClick={handleExport} className="w-full">
              JSONファイルで保存
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              推奨: 月1回、または大きな変更後<br />
              保存先: iCloud Drive（ファイルアプリ）
            </p>
            {lastExport && (
              <p className="text-xs text-gray-600 mt-1">
                最終保存: {formatDateTime(lastExport)}
              </p>
            )}
          </div>

          {/* 復元 */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">復元</h3>
            <Button size="medium" variant="secondary" onClick={handleImportClick} className="w-full">
              JSONファイルから読込
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <p className="text-xs text-red-600 mt-2">
              ⚠ 現在のデータは上書きされます
            </p>
          </div>

          {/* 利用履歴 */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">利用履歴（直近10件）</h3>
            <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-sm text-center">履歴がありません</p>
              ) : (
                <ul className="space-y-2">
                  {logs.map((log) => (
                    <li key={log.id} className="text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {formatDateTime(log.start)}
                        </span>
                        <span className={`font-medium ${
                          log.type === 'grant' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {log.type === 'grant' ? '+' : ''}{log.amount}分
                        </span>
                      </div>
                      {log.note && (
                        <p className="text-xs text-gray-500">{log.note}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};

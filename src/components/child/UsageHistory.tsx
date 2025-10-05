import React from 'react';
import { StorageService } from '../../services/storage';
import { formatDateTime } from '../../utils/time';
import type { UsageLog } from '../../types';

export const UsageHistory: React.FC = () => {
  const [logs, setLogs] = React.useState<UsageLog[]>([]);

  // ログを読み込み
  React.useEffect(() => {
    loadLogs();

    // 5秒ごとに自動リロード
    const interval = setInterval(() => {
      loadLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadLogs = async () => {
    const recentLogs = await StorageService.getLogs(10);
    setLogs(recentLogs);
  };

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">📊 りれき</h3>
        <p className="text-xs text-gray-500 text-center py-2">まだ りれきが ありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 りれき（さいきん10かい）</h3>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {logs.map((log) => {
          const isGrant = log.type === 'grant';
          const bgColor = isGrant ? 'bg-green-50' : 'bg-red-50';
          const textColor = isGrant ? 'text-green-700' : 'text-red-700';
          const icon = isGrant ? '➕' : '➖';
          const sign = isGrant ? '+' : '-';

          return (
            <div
              key={log.id}
              className={`${bgColor} rounded-lg p-2 flex items-center justify-between`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{icon}</span>
                <div>
                  <div className={`font-bold ${textColor}`}>
                    {sign}{log.amount}ぷん
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatDateTime(log.start)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

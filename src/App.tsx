import React from 'react';
import { useAppStore } from './stores/appStore';
import { ChildHome } from './components/child/ChildHome';
import { ChildSelector } from './components/child/ChildSelector';
import { PinInput } from './components/parent/PinInput';
import { ParentPanel } from './components/parent/ParentPanel';
import { Toast } from './components/common/Toast';

function App() {
  const {
    children,
    selectedChildId,
    isParentMode,
    toastMessage,
    error,
    initialize,
    exitParentMode,
    setError
  } = useAppStore();

  const [showPinInput, setShowPinInput] = React.useState(false);

  // アプリ初期化
  React.useEffect(() => {
    initialize();
  }, [initialize]);

  // 親モード要求イベントのリスナー
  React.useEffect(() => {
    const handleRequestParentMode = () => {
      setShowPinInput(true);
    };

    window.addEventListener('requestParentMode', handleRequestParentMode);
    return () => {
      window.removeEventListener('requestParentMode', handleRequestParentMode);
    };
  }, []);

  const handlePinSuccess = () => {
    // PinInputコンポーネント内でPINを入力し、ここで検証を行う
    // 実際の入力値はPinInputから直接enterParentModeを呼ぶように変更
    setShowPinInput(false);
  };

  const handlePinCancel = () => {
    setShowPinInput(false);
    // isParentModeがtrueの場合のみexitを呼ぶ
    if (isParentMode) {
      exitParentMode();
    }
    setError(null);
  };

  // 画面判定: 子供が未登録または未選択の場合はChildSelectorを表示
  const shouldShowChildSelector = children.length === 0 || (!isParentMode && !selectedChildId);

  // エラー表示
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  return (
    <div className="app">
      {/* エラー表示 */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* トースト表示 */}
      <Toast message={toastMessage} />

      {/* メイン画面 */}
      {showPinInput ? (
        <PinInput
          onSuccess={handlePinSuccess}
          onCancel={handlePinCancel}
        />
      ) : isParentMode ? (
        <ParentPanel />
      ) : shouldShowChildSelector ? (
        <ChildSelector />
      ) : (
        <ChildHome />
      )}
    </div>
  );
}

export default App;

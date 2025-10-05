import React from 'react';
import { Button } from '../common/Button';
import { validatePin } from '../../utils/validation';

interface PinInputProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PinInput: React.FC<PinInputProps> = ({ onSuccess, onCancel }) => {
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState('');

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePin(pin)) {
      setError('4桁の数字を入力してください');
      return;
    }

    // useAppStore.enterParentMode はここでは呼ばず、親コンポーネントで処理
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔒 親モード</h1>
          <p className="text-gray-600">PINを入力してください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="number"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={pin}
              onChange={handlePinChange}
              placeholder="＿ ＿ ＿ ＿"
              className="w-full text-center text-4xl font-bold tracking-widest p-4 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
            {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
          </div>

          <div className="space-y-3">
            <Button size="large" onClick={handleSubmit}>
              開く
            </Button>
            <Button size="large" variant="secondary" onClick={onCancel}>
              キャンセル
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

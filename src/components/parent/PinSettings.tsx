import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import { validatePin, ValidationMessages } from '../../utils/validation';

export const PinSettings: React.FC = () => {
  const { pin, setPin, showToast } = useAppStore();

  const [isOpen, setIsOpen] = React.useState(false);
  const [currentPin, setCurrentPin] = React.useState('');
  const [newPin, setNewPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [error, setError] = React.useState('');

  const handleOpen = () => {
    setIsOpen(true);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 現在のPINチェック
    if (currentPin !== pin) {
      setError('現在のPINが正しくありません');
      return;
    }

    // 新しいPINのバリデーション
    if (!validatePin(newPin)) {
      setError(ValidationMessages.PIN_INVALID);
      return;
    }

    // 確認PINチェック
    if (newPin !== confirmPin) {
      setError(ValidationMessages.PIN_MISMATCH);
      return;
    }

    // 現在と同じPINの場合
    if (newPin === pin) {
      setError('現在と同じPINです');
      return;
    }

    // PIN更新
    await setPin(newPin);
    showToast('PINを変更しました');
    handleClose();
  };

  return (
    <>
      <Button variant="secondary" onClick={handleOpen}>
        PIN変更
      </Button>

      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title="🔐 PIN変更"
        actions={
          <>
            <Button variant="secondary" onClick={handleClose}>
              キャンセル
            </Button>
            <Button onClick={handleSubmit}>
              変更する
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              現在のPIN
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={currentPin}
              onChange={(e) => {
                setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                setError('');
              }}
              className="w-full text-center text-2xl font-bold tracking-widest p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              placeholder="＿ ＿ ＿ ＿"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新しいPIN
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={newPin}
              onChange={(e) => {
                setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                setError('');
              }}
              className="w-full text-center text-2xl font-bold tracking-widest p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              placeholder="＿ ＿ ＿ ＿"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新しいPIN（確認）
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => {
                setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                setError('');
              }}
              className="w-full text-center text-2xl font-bold tracking-widest p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              placeholder="＿ ＿ ＿ ＿"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}
        </form>
      </Dialog>
    </>
  );
};

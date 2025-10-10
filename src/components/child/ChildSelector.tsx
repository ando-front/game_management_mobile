import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import type { Child } from '../../types';

export const ChildSelector: React.FC = () => {
  const { children, selectChild, addChild, updateChildName } = useAppStore();
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [editingChild, setEditingChild] = React.useState<Child | null>(null);

  const handleSelect = (childId: string) => {
    selectChild(childId);
  };

  const handleAddChild = () => {
    if (newName.trim()) {
      addChild(newName.trim());
      setNewName('');
      setShowAddDialog(false);
    }
  };

  const handleEditName = () => {
    if (editingChild && newName.trim()) {
      updateChildName(editingChild.id, newName.trim());
      setNewName('');
      setEditingChild(null);
      setShowEditDialog(false);
    }
  };

  const openEditDialog = (child: Child) => {
    setEditingChild(child);
    setNewName(child.name);
    setShowEditDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white p-4" style={{ overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }}>
      <div className="w-full max-w-md mx-auto">
        <div className="text-center my-6">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">👶 だれの じかん？</h1>
          <p className="text-gray-600">なまえを えらんでね</p>
          <p className="text-xs text-gray-400 mt-1">デバッグ: 子供数={children.length}</p>
        </div>

        {/* 子供リスト */}
        <div className="space-y-4 mb-6">
          {children.map((child) => (
            <div key={child.id} className="flex items-center space-x-3">
              <Button
                size="large"
                onClick={() => handleSelect(child.id)}
                className="flex-1"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">{child.name}</span>
                  <span className="text-sm text-indigo-200">
                    {child.remainingMinutes}ぷん のこり
                  </span>
                </div>
              </Button>
              <button
                onClick={() => openEditDialog(child)}
                className="p-4 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-xl"
              >
                ✏️
              </button>
            </div>
          ))}
        </div>

        {/* 子供追加ボタン（2人未満の場合のみ） */}
        {children.length < 2 && (
          <div className="mb-6">
            <Button
              variant="primary"
              size="large"
              onClick={() => setShowAddDialog(true)}
              className="w-full text-xl"
            >
              ➕ なまえを ついかする
            </Button>
          </div>
        )}

        {/* 親モードボタン */}
        <div className="mb-6">
          <Button
            variant="secondary"
            size="large"
            onClick={() => window.dispatchEvent(new CustomEvent('requestParentMode'))}
            className="w-full"
          >
            👨‍👩‍👧‍👦 親モード
          </Button>
        </div>
      </div>

      {/* 名前追加ダイアログ */}
      <Dialog
        isOpen={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setNewName('');
        }}
        title="なまえを ついかする"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddDialog(false);
                setNewName('');
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleAddChild} disabled={!newName.trim()}>
              ついかする
            </Button>
          </>
        }
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="なまえを いれてね"
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-lg"
          maxLength={10}
          autoFocus
        />
        <p className="text-xs text-gray-500 mt-2">
          ひらがな、カタカナ、かんじ が つかえます（さいだい10もじ）
        </p>
      </Dialog>

      {/* 名前編集ダイアログ */}
      <Dialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setNewName('');
          setEditingChild(null);
        }}
        title="なまえを へんこうする"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditDialog(false);
                setNewName('');
                setEditingChild(null);
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleEditName} disabled={!newName.trim()}>
              へんこうする
            </Button>
          </>
        }
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="あたらしい なまえ"
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-lg"
          maxLength={10}
          autoFocus
        />
      </Dialog>
    </div>
  );
};

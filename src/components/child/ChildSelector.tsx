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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">👶 だれの じかん？</h1>
          <p className="text-gray-600">なまえを えらんでね</p>
        </div>

        {/* 子供リスト */}
        <div className="space-y-3 mb-6">
          {children.map((child) => (
            <div key={child.id} className="flex items-center space-x-2">
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
                className="p-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                ✏️
              </button>
            </div>
          ))}
        </div>

        {/* 子供追加ボタン（2人未満の場合のみ） */}
        {children.length < 2 && (
          <Button
            variant="secondary"
            onClick={() => setShowAddDialog(true)}
            className="w-full"
          >
            ➕ なまえを ついかする
          </Button>
        )}

        {/* 親モードボタン */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('requestParentMode'))}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            親モード →
          </button>
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

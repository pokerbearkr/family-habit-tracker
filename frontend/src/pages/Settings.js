import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowLeft, Trash2, AlertTriangle, User, Mail, Shield, Edit, Check, X, Coffee, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { authAPI } from '../services/api';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  const handleStartEditName = () => {
    setNewDisplayName(user?.displayName || '');
    setEditingName(true);
    setNameError('');
  };

  const handleCancelEditName = () => {
    setEditingName(false);
    setNewDisplayName('');
    setNameError('');
  };

  const handleSaveDisplayName = async () => {
    if (!newDisplayName.trim()) {
      setNameError('이름을 입력해주세요.');
      return;
    }

    setSavingName(true);
    setNameError('');

    try {
      const response = await authAPI.updateDisplayName(newDisplayName.trim());
      // Update user in context
      updateUser({ ...user, displayName: response.data.displayName });
      setEditingName(false);
      setNewDisplayName('');
    } catch (err) {
      console.error('Error updating display name:', err);
      setNameError('이름 변경 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSavingName(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setError('');

    try {
      await api.deleteAccount();
      // Logout and redirect to login page
      logout();
      navigate('/login');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('계정 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-blue-600" />
          </button>
          <h1 className="text-2xl font-bold">설정</h1>
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              계정 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Display Name - Editable */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">사용자 이름</p>
                {!editingName && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartEditName}
                    className="h-8 px-2"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {editingName ? (
                <div className="space-y-2">
                  <Input
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="새 이름 입력"
                    disabled={savingName}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveDisplayName();
                      }
                    }}
                  />
                  {nameError && (
                    <p className="text-sm text-red-600">{nameError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveDisplayName}
                      disabled={savingName}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {savingName ? '저장 중...' : '저장'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEditName}
                      disabled={savingName}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="font-medium">{user?.displayName}</p>
              )}
            </div>

            {/* Email - Read Only */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">이메일</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              개인정보 보호
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/privacy-policy')}
            >
              개인정보 처리방침 보기
            </Button>
          </CardContent>
        </Card>

        {/* Developer Support */}
        <Card className="border-amber-200 bg-gradient-to-br from-white to-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Coffee className="h-5 w-5" />
              개발자 후원
            </CardTitle>
            <CardDescription>
              이 앱이 도움이 되셨나요? 커피 한 잔으로 응원해주세요!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => window.open('https://buymeacoffee.com/programtuna', '_blank')}
            >
              <Coffee className="h-4 w-4 mr-2" />
              커피 한 잔 사주기
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              위험 영역
            </CardTitle>
            <CardDescription>
              이 작업은 되돌릴 수 없습니다. 신중하게 진행해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              회원 탈퇴
            </Button>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                정말로 탈퇴하시겠습니까?
              </DialogTitle>
              <DialogDescription className="space-y-3 pt-3">
                <p className="font-medium">이 작업은 되돌릴 수 없습니다.</p>
                <p>계정을 삭제하면 다음 데이터가 영구적으로 삭제됩니다:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>모든 습관 기록</li>
                  <li>습관 완료 데이터</li>
                  <li>계정 정보</li>
                  <li>가족 구성원 정보 (본인)</li>
                </ul>
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setError('');
                }}
                disabled={deleting}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? '삭제 중...' : '계정 삭제'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

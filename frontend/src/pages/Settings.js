import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowLeft, Trash2, AlertTriangle, User, Mail, Shield } from 'lucide-react';
import api from '../services/api';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

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
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">사용자 이름</p>
                <p className="font-medium">{user?.displayName}</p>
              </div>
            </div>
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

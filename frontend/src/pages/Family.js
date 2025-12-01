import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { familyAPI } from '../services/api';
import { Toaster } from 'react-hot-toast';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  Home,
  TrendingUp,
  DoorOpen,
  Users,
  Copy,
  UserPlus,
  UserMinus,
  Check,
  Settings,
  Edit,
  X,
  AlertTriangle
} from 'lucide-react';

function Family() {
  const { user, logout, updateUserFamily } = useAuth();
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editedFamilyName, setEditedFamilyName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user.familyId) {
      loadFamily();
    } else {
      setLoading(false);
    }
  }, [user.familyId]);

  const loadFamily = async () => {
    try {
      const response = await familyAPI.getMy();
      setFamily(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading family:', error);
      setLoading(false);
    }
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setSubmitting(true);

    try {
      const response = await familyAPI.create(newFamilyName);
      updateUserFamily(response.data.id, response.data.name);
      navigate('/dashboard');
    } catch (error) {
      console.error('Create family error:', error);
      const errorMsg = error.response?.data?.message ||
                      error.response?.data?.error ||
                      (typeof error.response?.data === 'string' ? error.response.data : null) ||
                      '그룹 생성에 실패했습니다';
      setError(errorMsg);
      setSubmitting(false);
    }
  };

  const handleJoinFamily = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setSubmitting(true);

    try {
      const response = await familyAPI.join(inviteCode);
      updateUserFamily(response.data.id, response.data.name);
      navigate('/dashboard');
    } catch (error) {
      console.error('Join family error:', error);
      const errorMsg = error.response?.data?.message ||
                      error.response?.data?.error ||
                      (typeof error.response?.data === 'string' ? error.response.data : null) ||
                      '그룹 가입에 실패했습니다';
      setError(errorMsg);
      setSubmitting(false);
    }
  };

  const handleLeaveFamily = () => {
    setShowLeaveDialog(true);
  };

  const confirmLeaveFamily = async () => {
    try {
      await familyAPI.leave();
      setShowLeaveDialog(false);
      window.location.reload();
    } catch (error) {
      console.error('Leave family error:', error);
      const errorMsg = error.response?.data?.message ||
                      error.response?.data?.error ||
                      (typeof error.response?.data === 'string' ? error.response.data : null) ||
                      '그룹 떠나기에 실패했습니다';
      setError(errorMsg);
      setShowLeaveDialog(false);
    }
  };

  const handleCopyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(family.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleStartEditName = () => {
    setEditedFamilyName(family?.name || '');
    setEditingName(true);
    setNameError('');
  };

  const handleCancelEditName = () => {
    setEditingName(false);
    setEditedFamilyName('');
    setNameError('');
  };

  const handleSaveFamilyName = async () => {
    if (!editedFamilyName.trim()) {
      setNameError('그룹 이름을 입력해주세요.');
      return;
    }

    setSavingName(true);
    setNameError('');

    try {
      const response = await familyAPI.updateName(editedFamilyName.trim());
      setFamily(response.data);
      updateUserFamily(response.data.id, response.data.name);
      setEditingName(false);
      setEditedFamilyName('');
    } catch (err) {
      console.error('Error updating family name:', err);
      setNameError('그룹 이름 변경 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSavingName(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-figma-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-figma-blue-100 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-figma-black-40">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-figma-bg pb-8">
      <Toaster position="top-right" />

      {/* Header - Dashboard style */}
      <header className="bg-white dark:bg-gray-800 border-b border-figma-black-10 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-6 py-4">
          {/* Top Row - Icons */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-12 h-12 flex items-center justify-center rounded-2xl border border-figma-black-10 bg-white dark:bg-gray-800 hover:bg-figma-black-10 transition-colors"
            >
              <Home className="w-5 h-5 text-figma-black-60" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/monthly')}
                className="w-12 h-12 flex items-center justify-center rounded-2xl border border-figma-black-10 bg-white dark:bg-gray-800 hover:bg-figma-black-10 transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-figma-black-60" />
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="w-12 h-12 flex items-center justify-center rounded-2xl border border-figma-black-10 bg-white dark:bg-gray-800 hover:bg-figma-black-10 transition-colors"
              >
                <Settings className="w-5 h-5 text-figma-black-60" />
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-figma-black-100">
                그룹 관리 👥
              </h1>
              <p className="text-sm text-figma-black-40">
                {family ? family.name : '그룹을 만들거나 가입하세요'}
              </p>
            </div>
            <button
              onClick={() => setShowLogoutDialog(true)}
              className="w-10 h-10 bg-figma-black-10 rounded-full flex items-center justify-center hover:bg-figma-black-20 transition-colors"
              title="로그아웃"
            >
              <DoorOpen className="w-5 h-5 text-figma-black-60" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-6 py-4">
        {family ? (
          <div className="space-y-4">
            {/* Family Info Card */}
            <div className="bg-white dark:bg-gray-800 border border-figma-black-10 rounded-2xl p-4">
              {/* Family Name */}
              <div className="mb-4">
                {editingName ? (
                  <div className="space-y-3">
                    <Input
                      value={editedFamilyName}
                      onChange={(e) => setEditedFamilyName(e.target.value)}
                      placeholder="그룹 이름 입력"
                      disabled={savingName}
                      className="text-xl font-semibold h-12 rounded-xl border-figma-black-10 focus:border-figma-blue-100"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveFamilyName();
                        }
                      }}
                    />
                    {nameError && (
                      <p className="text-sm text-figma-red">{nameError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveFamilyName}
                        disabled={savingName}
                        className="flex items-center gap-1 px-4 py-2 bg-figma-green text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        {savingName ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={handleCancelEditName}
                        disabled={savingName}
                        className="flex items-center gap-1 px-4 py-2 bg-figma-black-10 text-figma-black-60 text-sm font-medium rounded-xl hover:bg-figma-black-20 transition-colors disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-figma-black-100">{family.name}</h2>
                    <button
                      onClick={handleStartEditName}
                      className="p-2 rounded-xl hover:bg-figma-black-10 transition-colors text-figma-black-40"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Invite Code Section */}
              <div className="bg-gradient-to-r from-[#6B73FF] to-[#3843FF] rounded-2xl p-4 mb-4">
                <p className="text-white/80 text-xs font-medium uppercase tracking-wide mb-2">
                  초대 코드
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-white tracking-widest">
                    {family.inviteCode}
                  </p>
                  <button
                    onClick={handleCopyInviteCode}
                    className="p-2.5 bg-white dark:bg-gray-800/20 rounded-xl hover:bg-white dark:bg-gray-800/30 transition-colors"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <Copy className="h-5 w-5 text-white" />
                    )}
                  </button>
                </div>
                <p className="text-white/70 text-xs mt-2">
                  그룹 구성원과 이 코드를 공유하세요
                </p>
              </div>

              {/* Members List */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-figma-black-60" />
                    <h3 className="text-sm font-medium text-figma-black-100">
                      그룹 구성원
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 bg-figma-blue-10 text-figma-blue-100 text-xs font-medium rounded-full">
                    {family.members?.length || 0}명
                  </span>
                </div>
                <div className="space-y-2">
                  {family.members?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 bg-figma-bg rounded-xl"
                    >
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#6B73FF] to-[#3843FF] flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {member.displayName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-figma-black-100 text-sm">
                          {member.displayName}
                        </p>
                        <p className="text-xs text-figma-black-40">
                          @{member.username}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leave Family Button */}
              <button
                onClick={handleLeaveFamily}
                className="w-full h-11 bg-figma-red text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <UserMinus className="h-4 w-4" />
                그룹 떠나기
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Create or Join Family Card */}
            <div className="bg-white dark:bg-gray-800 border border-figma-black-10 rounded-2xl p-4">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-[#6B73FF] to-[#3843FF] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-figma-black-100">
                  그룹 만들기 또는 가입하기
                </h2>
                <p className="text-figma-black-40 text-sm mt-1">
                  그룹을 생성하거나 초대 코드로 기존 그룹에 가입하세요
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 text-sm text-figma-red bg-red-50 border border-red-100 rounded-xl">
                  {error}
                </div>
              )}

              {/* Create Family */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-figma-blue-100" />
                  <h3 className="text-sm font-medium text-figma-black-100">
                    새 그룹 만들기
                  </h3>
                </div>
                <form onSubmit={handleCreateFamily} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="familyName" className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">
                      그룹 이름
                    </Label>
                    <Input
                      id="familyName"
                      type="text"
                      placeholder="예: 우리 그룹"
                      value={newFamilyName}
                      onChange={(e) => setNewFamilyName(e.target.value)}
                      required
                      className="rounded-xl border-figma-black-10 focus:border-figma-blue-100 focus:ring-figma-blue-100 h-11"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 bg-gradient-to-r from-[#6B73FF] to-[#3843FF] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        생성 중...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        만들기
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-figma-black-10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-figma-black-40 text-xs font-medium">
                    또는
                  </span>
                </div>
              </div>

              {/* Join Family */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-figma-blue-100" />
                  <h3 className="text-sm font-medium text-figma-black-100">
                    기존 그룹 가입하기
                  </h3>
                </div>
                <form onSubmit={handleJoinFamily} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode" className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">
                      초대 코드
                    </Label>
                    <Input
                      id="inviteCode"
                      type="text"
                      placeholder="초대 코드를 입력하세요"
                      value={inviteCode}
                      onChange={(e) =>
                        setInviteCode(e.target.value.toUpperCase())
                      }
                      required
                      className="rounded-xl border-figma-black-10 focus:border-figma-blue-100 focus:ring-figma-blue-100 h-11 uppercase tracking-wider"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 bg-figma-green text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        가입 중...
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4" />
                        가입하기
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="rounded-3xl border-0 shadow-figma max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-figma-black-100">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              로그아웃
            </DialogTitle>
            <DialogDescription className="text-figma-black-40">
              정말 로그아웃하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              onClick={() => setShowLogoutDialog(false)}
              className="flex-1 h-11 bg-figma-black-10 text-figma-black-60 font-medium rounded-xl hover:bg-figma-black-20 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex-1 h-11 bg-figma-blue-100 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              로그아웃
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Family Confirmation Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="rounded-3xl border-0 shadow-figma max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-figma-red">
              <AlertTriangle className="h-5 w-5" />
              그룹 떠나기
            </DialogTitle>
            <DialogDescription className="pt-3 text-figma-black-60">
              <p className="font-medium text-figma-black-100 mb-2">정말 이 그룹을 떠나시겠습니까?</p>
              <p className="text-sm">
                모든 공유 습관에 대한 접근 권한을 잃게 됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
              {error && (
                <div className="mt-3 p-3 text-sm text-figma-red bg-red-50 border border-red-100 rounded-xl">
                  {error}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              onClick={() => {
                setShowLeaveDialog(false);
                setError('');
              }}
              className="flex-1 h-11 bg-figma-black-10 text-figma-black-60 font-medium rounded-xl hover:bg-figma-black-20 transition-colors"
            >
              취소
            </button>
            <button
              onClick={confirmLeaveFamily}
              className="flex-1 h-11 bg-figma-red text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              그룹 떠나기
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Family;

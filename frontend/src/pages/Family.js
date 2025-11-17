import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { familyAPI, authAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Home,
  TrendingUp,
  LogOut,
  Users,
  Copy,
  UserPlus,
  UserMinus,
  Bell,
  BellOff,
  Check
} from 'lucide-react';

function Family() {
  const { user, logout, updateUserFamily } = useAuth();
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [enableReminders, setEnableReminders] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadReminderSettings();
    if (user.familyId) {
      loadFamily();
    } else {
      setLoading(false);
    }
  }, [user.familyId]);

  const loadReminderSettings = async () => {
    try {
      const response = await authAPI.getReminderSettings();
      setEnableReminders(response.data.enableReminders);
    } catch (error) {
      console.error('Error loading reminder settings:', error);
    }
  };

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

    // Prevent duplicate submissions
    if (submitting) return;

    setError('');
    setSubmitting(true);

    try {
      const response = await familyAPI.create(newFamilyName);
      // Update user data via AuthContext
      updateUserFamily(response.data.id, response.data.name);
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Create family error:', error);
      const errorMsg = error.response?.data?.message ||
                      error.response?.data?.error ||
                      (typeof error.response?.data === 'string' ? error.response.data : null) ||
                      '가족 생성에 실패했습니다';
      setError(errorMsg);
      setSubmitting(false);
    }
  };

  const handleJoinFamily = async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (submitting) return;

    setError('');
    setSubmitting(true);

    try {
      const response = await familyAPI.join(inviteCode);
      // Update user data via AuthContext
      updateUserFamily(response.data.id, response.data.name);
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Join family error:', error);
      const errorMsg = error.response?.data?.message ||
                      error.response?.data?.error ||
                      (typeof error.response?.data === 'string' ? error.response.data : null) ||
                      '가족 가입에 실패했습니다';
      setError(errorMsg);
      setSubmitting(false);
    }
  };

  const handleLeaveFamily = async () => {
    if (
      window.confirm(
        '정말 이 가족을 떠나시겠습니까? 모든 공유 습관에 대한 접근 권한을 잃게 됩니다.'
      )
    ) {
      try {
        await familyAPI.leave();
        window.location.reload();
      } catch (error) {
        console.error('Leave family error:', error);
        const errorMsg = error.response?.data?.message ||
                        error.response?.data?.error ||
                        (typeof error.response?.data === 'string' ? error.response.data : null) ||
                        '가족 떠나기에 실패했습니다';
        setError(errorMsg);
      }
    }
  };

  const handleToggleReminders = async () => {
    try {
      const newValue = !enableReminders;
      const response = await authAPI.updateReminderSettings(newValue);
      setEnableReminders(response.data.enableReminders);
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      alert('알림 설정 변경에 실패했습니다');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg font-medium text-gray-700">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-600" />
              가족 관리
            </h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="h-10 w-10"
              >
                <Home className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/monthly')}
                className="h-10 w-10"
              >
                <TrendingUp className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (window.confirm('로그아웃하시겠습니까?')) {
                    logout();
                  }
                }}
                className="h-10 w-10"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {family ? (
          <div className="space-y-6">
            {/* Family Info Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-3xl">{family.name}</CardTitle>
                <CardDescription>가족 정보 및 설정</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Invite Code Section */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-lg p-6">
                  <Label className="text-sm font-medium text-gray-600 mb-2 block">
                    초대 코드
                  </Label>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-4xl font-bold text-indigo-600 tracking-widest">
                        {family.inviteCode}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyInviteCode}
                      className="h-12 w-12 shrink-0"
                    >
                      {copied ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    가족 구성원과 이 코드를 공유하세요
                  </p>
                </div>

                {/* Members List */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      가족 구성원
                    </h3>
                    <Badge variant="secondary" className="ml-auto">
                      {family.members?.length || 0}명
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {family.members?.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold">
                              {member.displayName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.displayName}
                            </p>
                            <p className="text-sm text-gray-500">
                              @{member.username}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settings Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      알림 설정
                    </h3>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {enableReminders ? (
                            <Bell className="h-4 w-4 text-indigo-600" />
                          ) : (
                            <BellOff className="h-4 w-4 text-gray-400" />
                          )}
                          <Label className="font-medium text-gray-900 cursor-pointer">
                            오후 9시 습관 알림
                          </Label>
                        </div>
                        <p className="text-sm text-gray-600">
                          미완료 습관이 있을 때 알림을 받습니다
                        </p>
                      </div>
                      <button
                        onClick={handleToggleReminders}
                        className={`
                          relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full
                          border-2 border-transparent transition-colors duration-200 ease-in-out
                          focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2
                          ${enableReminders ? 'bg-indigo-600' : 'bg-gray-200'}
                        `}
                        role="switch"
                        aria-checked={enableReminders}
                      >
                        <span
                          className={`
                            pointer-events-none inline-block h-6 w-6 transform rounded-full
                            bg-white shadow ring-0 transition duration-200 ease-in-out
                            ${enableReminders ? 'translate-x-5' : 'translate-x-0'}
                          `}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Leave Family Button */}
                <div className="pt-4">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleLeaveFamily}
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    가족 떠나기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Create or Join Family */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">가족 만들기 또는 가입하기</CardTitle>
                <CardDescription>
                  가족을 생성하거나 초대 코드로 기존 가족에 가입하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Create Family */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      새 가족 만들기
                    </h3>
                  </div>
                  <form onSubmit={handleCreateFamily} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="familyName">가족 이름</Label>
                      <Input
                        id="familyName"
                        type="text"
                        placeholder="예: 우리 가족"
                        value={newFamilyName}
                        onChange={(e) => setNewFamilyName(e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      {submitting ? '생성 중...' : '만들기'}
                    </Button>
                  </form>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">
                      또는
                    </span>
                  </div>
                </div>

                {/* Join Family */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      기존 가족 가입하기
                    </h3>
                  </div>
                  <form onSubmit={handleJoinFamily} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="inviteCode">초대 코드</Label>
                      <Input
                        id="inviteCode"
                        type="text"
                        placeholder="초대 코드를 입력하세요"
                        value={inviteCode}
                        onChange={(e) =>
                          setInviteCode(e.target.value.toUpperCase())
                        }
                        required
                        className="w-full uppercase tracking-wider"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {submitting ? '가입 중...' : '가입하기'}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default Family;

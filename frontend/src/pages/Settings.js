import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Trash2, AlertTriangle, User, Mail, Shield, Edit, Check, X, Coffee, ExternalLink, Bell, Clock, Home, TrendingUp, Users, Moon, Sun, Monitor } from 'lucide-react';
import api from '../services/api';
import { authAPI } from '../services/api';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { isDark, setTheme } = useTheme();
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'system';
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  // Reminder settings
  const [enableReminders, setEnableReminders] = useState(true);
  const [reminderTime, setReminderTime] = useState('21:00');
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [savingReminders, setSavingReminders] = useState(false);

  // Load reminder settings on mount
  useEffect(() => {
    const loadReminderSettings = async () => {
      try {
        const response = await authAPI.getReminderSettings();
        setEnableReminders(response.data.enableReminders);
        setReminderTime(response.data.reminderTime || '21:00');
      } catch (err) {
        console.error('Error loading reminder settings:', err);
      } finally {
        setLoadingReminders(false);
      }
    };
    loadReminderSettings();
  }, []);

  const handleReminderToggle = async () => {
    setSavingReminders(true);
    try {
      const newValue = !enableReminders;
      await authAPI.updateReminderSettings({ enableReminders: newValue });
      setEnableReminders(newValue);
    } catch (err) {
      console.error('Error updating reminder settings:', err);
    } finally {
      setSavingReminders(false);
    }
  };

  const handleReminderTimeChange = async (newTime) => {
    setSavingReminders(true);
    try {
      await authAPI.updateReminderSettings({ reminderTime: newTime });
      setReminderTime(newTime);
    } catch (err) {
      console.error('Error updating reminder time:', err);
    } finally {
      setSavingReminders(false);
    }
  };

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
      logout();
      navigate('/login');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('계정 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
      setDeleting(false);
    }
  };

  const handleThemeChange = (mode) => {
    setThemeMode(mode);
    setTheme(mode);
  };

  return (
    <div className="min-h-screen bg-figma-bg pb-8">
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
                onClick={() => navigate('/family')}
                className="w-12 h-12 flex items-center justify-center rounded-2xl border border-figma-black-10 bg-white dark:bg-gray-800 hover:bg-figma-black-10 transition-colors"
              >
                <Users className="w-5 h-5 text-figma-black-60" />
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-lg font-medium text-figma-black-100">
              설정
            </h1>
            <p className="text-sm text-figma-black-40">
              알림, 계정 정보를 관리하세요
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-4 space-y-4">
        {/* Account Info */}
        <div className="bg-white dark:bg-gray-800 border border-figma-black-10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-figma-blue-100" />
            <h2 className="font-semibold text-figma-black-100">계정 정보</h2>
          </div>

          {/* Display Name - Editable */}
          <div className="bg-figma-bg rounded-2xl p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">사용자 이름</p>
              {!editingName && (
                <button
                  onClick={handleStartEditName}
                  className="p-1.5 rounded-lg hover:bg-figma-black-10 transition-colors text-figma-black-40"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
            </div>
            {editingName ? (
              <div className="space-y-3">
                <Input
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="새 이름 입력"
                  disabled={savingName}
                  className="rounded-xl border-figma-black-10 focus:border-figma-blue-100 h-11"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveDisplayName();
                    }
                  }}
                />
                {nameError && (
                  <p className="text-sm text-figma-red">{nameError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDisplayName}
                    disabled={savingName}
                    className="flex-1 h-10 bg-figma-green text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    {savingName ? '저장 중...' : '저장'}
                  </button>
                  <button
                    onClick={handleCancelEditName}
                    disabled={savingName}
                    className="flex-1 h-10 bg-figma-black-10 text-figma-black-60 text-sm font-medium rounded-xl hover:bg-figma-black-20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <p className="font-medium text-figma-black-100">{user?.displayName}</p>
            )}
          </div>

          {/* Email - Read Only */}
          <div className="bg-figma-bg rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-figma-black-40" />
              <div>
                <p className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">이메일</p>
                <p className="font-medium text-figma-black-100">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 border border-figma-black-10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-figma-blue-100" />
            <h2 className="text-sm font-medium text-figma-black-100">알림 설정</h2>
          </div>
          <p className="text-sm text-figma-black-40 mb-4">
            미완료 습관 알림을 받을 시간을 설정하세요
          </p>

          {loadingReminders ? (
            <div className="flex items-center justify-center py-4 text-figma-black-40">
              <span className="w-4 h-4 border-2 border-figma-blue-100 border-t-transparent rounded-full animate-spin mr-2"></span>
              로딩 중...
            </div>
          ) : (
            <div className="space-y-3">
              {/* Enable/Disable Toggle */}
              <div className="bg-figma-bg rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-figma-black-60" />
                    <span className="font-medium text-figma-black-100">습관 알림 받기</span>
                  </div>
                  <button
                    onClick={handleReminderToggle}
                    disabled={savingReminders}
                    className={`
                      relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full
                      transition-colors duration-200 ease-in-out disabled:opacity-50
                      ${enableReminders ? 'bg-figma-green' : 'bg-figma-black-20'}
                    `}
                  >
                    <span
                      className={`
                        pointer-events-none inline-block h-6 w-6 transform rounded-full
                        bg-white dark:bg-gray-800 shadow-sm transition duration-200 ease-in-out mt-0.5 ml-0.5
                        ${enableReminders ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>
              </div>

              {/* Reminder Time Selection */}
              {enableReminders && (
                <div className="bg-figma-bg rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-figma-black-60" />
                    <span className="font-medium text-figma-black-100">알림 시간</span>
                  </div>
                  <select
                    value={reminderTime.split(':')[0]}
                    onChange={(e) => handleReminderTimeChange(`${e.target.value}:00`)}
                    disabled={savingReminders}
                    className="w-full p-3 border border-figma-black-10 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-figma-blue-100 focus:border-figma-blue-100 text-figma-black-100"
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      const displayHour = i === 0 ? '오전 12시' :
                                         i < 12 ? `오전 ${i}시` :
                                         i === 12 ? '오후 12시' :
                                         `오후 ${i - 12}시`;
                      return (
                        <option key={hour} value={hour}>
                          {displayHour}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-sm text-figma-black-40 mt-2">
                    선택한 시간에 미완료 습관이 있으면 알림을 받습니다
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 border border-figma-black-10 dark:border-gray-700 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            {isDark ? <Moon className="h-4 w-4 text-figma-blue-100" /> : <Sun className="h-4 w-4 text-figma-blue-100" />}
            <h2 className="text-sm font-medium text-figma-black-100 dark:text-white">테마 설정</h2>
          </div>
          <p className="text-sm text-figma-black-40 dark:text-gray-400 mb-4">
            앱의 테마를 선택하세요
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                themeMode === 'light'
                  ? 'border-figma-blue-100 bg-figma-blue-10'
                  : 'border-figma-black-10 dark:border-gray-600 hover:border-figma-black-20'
              }`}
            >
              <Sun className={`h-5 w-5 ${themeMode === 'light' ? 'text-figma-blue-100' : 'text-figma-black-40 dark:text-gray-400'}`} />
              <span className={`text-xs font-medium ${themeMode === 'light' ? 'text-figma-blue-100' : 'text-figma-black-60 dark:text-gray-300'}`}>
                라이트
              </span>
            </button>

            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                themeMode === 'dark'
                  ? 'border-figma-blue-100 bg-figma-blue-10 dark:bg-blue-900/30'
                  : 'border-figma-black-10 dark:border-gray-600 hover:border-figma-black-20'
              }`}
            >
              <Moon className={`h-5 w-5 ${themeMode === 'dark' ? 'text-figma-blue-100' : 'text-figma-black-40 dark:text-gray-400'}`} />
              <span className={`text-xs font-medium ${themeMode === 'dark' ? 'text-figma-blue-100' : 'text-figma-black-60 dark:text-gray-300'}`}>
                다크
              </span>
            </button>

            <button
              onClick={() => handleThemeChange('system')}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                themeMode === 'system'
                  ? 'border-figma-blue-100 bg-figma-blue-10 dark:bg-blue-900/30'
                  : 'border-figma-black-10 dark:border-gray-600 hover:border-figma-black-20'
              }`}
            >
              <Monitor className={`h-5 w-5 ${themeMode === 'system' ? 'text-figma-blue-100' : 'text-figma-black-40 dark:text-gray-400'}`} />
              <span className={`text-xs font-medium ${themeMode === 'system' ? 'text-figma-blue-100' : 'text-figma-black-60 dark:text-gray-300'}`}>
                시스템
              </span>
            </button>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white dark:bg-gray-800 border border-figma-black-10 dark:border-gray-700 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-figma-blue-100" />
            <h2 className="text-sm font-medium text-figma-black-100 dark:text-white">개인정보 보호</h2>
          </div>
          <button
            onClick={() => navigate('/privacy-policy')}
            className="w-full h-11 border border-figma-black-10 dark:border-gray-600 text-figma-black-100 dark:text-white text-sm font-medium rounded-xl hover:bg-figma-bg dark:hover:bg-gray-700 transition-colors"
          >
            개인정보 처리방침 보기
          </button>
        </div>

        {/* Developer Support */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Coffee className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-medium text-amber-700">개발자 후원</h2>
          </div>
          <p className="text-xs text-amber-600 mb-3">
            이 앱이 도움이 되셨나요? 커피 한 잔으로 응원해주세요!
          </p>
          <button
            onClick={() => window.open('https://buymeacoffee.com/programtuna', '_blank')}
            className="w-full h-11 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
          >
            <Coffee className="h-4 w-4" />
            커피 한 잔 사주기
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-figma-red" />
            <h2 className="text-sm font-medium text-figma-red">위험 영역</h2>
          </div>
          <p className="text-xs text-figma-black-40 mb-3">
            이 작업은 되돌릴 수 없습니다. 신중하게 진행해주세요.
          </p>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-full h-11 bg-figma-red text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            회원 탈퇴
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-3xl border-0 shadow-figma max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-figma-red">
              <AlertTriangle className="h-5 w-5" />
              정말로 탈퇴하시겠습니까?
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-3 text-figma-black-60">
              <p className="font-medium text-figma-black-100">이 작업은 되돌릴 수 없습니다.</p>
              <p className="text-sm">계정을 삭제하면 다음 데이터가 영구적으로 삭제됩니다:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-figma-black-40">
                <li>모든 습관 기록</li>
                <li>습관 완료 데이터</li>
                <li>계정 정보</li>
                <li>그룹 구성원 정보 (본인)</li>
              </ul>
              {error && (
                <div className="p-3 text-sm text-figma-red bg-red-50 border border-red-100 rounded-xl">
                  {error}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              onClick={() => {
                setShowDeleteDialog(false);
                setError('');
              }}
              disabled={deleting}
              className="flex-1 h-11 bg-figma-black-10 text-figma-black-60 font-medium rounded-xl hover:bg-figma-black-20 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="flex-1 h-11 bg-figma-red text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {deleting ? '삭제 중...' : '계정 삭제'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

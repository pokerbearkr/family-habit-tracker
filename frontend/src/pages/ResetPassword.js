import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 4) {
      setError('비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authAPI.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || '비밀번호 변경에 실패했습니다.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-figma-bg p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#6B73FF] to-[#3843FF] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-figma">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-figma-black-100">
              비밀번호 변경 완료
            </h1>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-figma">
            <div className="text-center space-y-4">
              <p className="text-figma-black-60 dark:text-gray-300">
                비밀번호가 성공적으로 변경되었습니다.
                <br />
                잠시 후 로그인 페이지로 이동합니다...
              </p>
              <div className="flex justify-center">
                <span className="w-6 h-6 border-2 border-figma-blue-100 border-t-transparent rounded-full animate-spin"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-figma-bg p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#6B73FF] to-[#3843FF] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-figma">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-figma-black-100">
            새 비밀번호 설정
          </h1>
          <p className="text-figma-black-40 mt-1">
            새로운 비밀번호를 입력해주세요
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-figma">
          {error && (
            <div className="mb-4 p-3 text-sm text-figma-red bg-red-50 border border-red-100 rounded-2xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">
                새 비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  placeholder="새 비밀번호를 입력하세요"
                  className="rounded-xl border-figma-black-10 focus:border-figma-blue-100 focus:ring-figma-blue-100 h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-figma-black-40 hover:text-figma-black-60 transition-colors"
                  aria-label="비밀번호 표시 토글"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">
                비밀번호 확인
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  placeholder="비밀번호를 다시 입력하세요"
                  className="rounded-xl border-figma-black-10 focus:border-figma-blue-100 focus:ring-figma-blue-100 h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-figma-black-40 hover:text-figma-black-60 transition-colors"
                  aria-label="비밀번호 확인 표시 토글"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#6B73FF] to-[#3843FF] text-white font-medium rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  변경 중...
                </span>
              ) : (
                '비밀번호 변경'
              )}
            </button>

            <p className="text-center text-sm text-figma-black-40 pt-2">
              <Link to="/login" className="text-figma-blue-100 hover:underline font-medium">
                로그인으로 돌아가기
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;

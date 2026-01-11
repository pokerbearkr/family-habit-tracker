import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError('');
    setLoading(true);

    try {
      await authAPI.requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || '요청 처리 중 오류가 발생했습니다.');
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
              이메일 전송 완료
            </h1>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-figma">
            <div className="text-center space-y-4">
              <p className="text-figma-black-60 dark:text-gray-300">
                <strong className="text-figma-black-100 dark:text-white">{email}</strong>
                <br />
                위 주소로 비밀번호 재설정 링크를 보냈습니다.
              </p>
              <p className="text-sm text-figma-black-40">
                이메일이 도착하지 않았다면 스팸 폴더를 확인해주세요.
                <br />
                링크는 1시간 동안 유효합니다.
              </p>
            </div>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full h-12 mt-6 bg-gradient-to-r from-[#6B73FF] to-[#3843FF] text-white font-medium rounded-2xl hover:opacity-90 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              로그인으로 돌아가기
            </Link>
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
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-figma-black-100">
            비밀번호 찾기
          </h1>
          <p className="text-figma-black-40 mt-1">
            가입한 이메일을 입력해주세요
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
              <Label htmlFor="email" className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">
                이메일
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="example@email.com"
                className="rounded-xl border-figma-black-10 focus:border-figma-blue-100 focus:ring-figma-blue-100 h-12"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#6B73FF] to-[#3843FF] text-white font-medium rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  전송 중...
                </span>
              ) : (
                '재설정 링크 보내기'
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

export default ForgotPassword;

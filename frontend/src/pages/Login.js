import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
        setLoading(false);
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-figma-bg p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#6B73FF] to-[#3843FF] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-figma">
            <span className="text-4xl">✨</span>
          </div>
          <h1 className="text-2xl font-semibold text-figma-black-100">
            습관 트래커
          </h1>
          <p className="text-figma-black-40 mt-1">
            함께 좋은 습관을 만들어요
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 shadow-figma">
          {error && (
            <div className="mb-4 p-3 text-sm text-figma-red bg-red-50 border border-red-100 rounded-2xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">
                아이디
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                placeholder="아이디를 입력하세요"
                className="rounded-xl border-figma-black-10 focus:border-figma-blue-100 focus:ring-figma-blue-100 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">
                비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="비밀번호를 입력하세요"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#6B73FF] to-[#3843FF] text-white font-medium rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  로그인 중...
                </span>
              ) : (
                '로그인'
              )}
            </button>

            <p className="text-center text-sm text-figma-black-40 pt-2">
              계정이 없으신가요?{' '}
              <Link to="/signup" className="text-figma-blue-100 hover:underline font-medium">
                회원가입
              </Link>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-figma-black-40 mt-6">
          로그인하면 서비스 이용약관에 동의하는 것으로 간주됩니다
        </p>
      </div>
    </div>
  );
}

export default Login;

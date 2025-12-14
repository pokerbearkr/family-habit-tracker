import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  // Cleanup timeout on unmount to prevent memory leak
  useEffect(() => {
    let timeoutId;
    if (success) {
      timeoutId = setTimeout(() => navigate('/login'), 2000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [success, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (loading) return;

    setError('');

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      const result = await signup(
        formData.username,
        formData.email,
        formData.password,
        formData.displayName
      );

      if (result.success) {
        setSuccess(true);
        // setTimeout handled by useEffect to prevent memory leak
      } else {
        setError(result.message);
        setLoading(false);
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-figma-bg p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-figma text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-figma-green" />
          </div>
          <h2 className="text-xl font-semibold text-figma-black-100">
            계정이 생성되었습니다!
          </h2>
          <p className="text-figma-black-40 mt-2">
            로그인 페이지로 이동 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-figma-bg p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#6B73FF] to-[#3843FF] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-figma">
            <span className="text-3xl">✨</span>
          </div>
          <h1 className="text-xl font-semibold text-figma-black-100">
            회원가입
          </h1>
          <p className="text-figma-black-40 text-sm mt-1">
            계정을 만들어 시작하세요
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-figma">
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
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                required
                placeholder="아이디를 입력하세요"
                className="rounded-xl border-figma-black-10 focus:border-figma-blue-100 focus:ring-figma-blue-100 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">
                이메일
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
                placeholder="example@email.com"
                className="rounded-xl border-figma-black-10 focus:border-figma-blue-100 focus:ring-figma-blue-100 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">
                표시 이름
              </Label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={handleChange}
                autoComplete="name"
                required
                placeholder="표시될 이름을 입력하세요"
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
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  minLength="6"
                  placeholder="최소 6자 이상"
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
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  minLength="6"
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
              className="w-full h-12 bg-figma-green text-white font-medium rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  가입 중...
                </span>
              ) : (
                '회원가입'
              )}
            </button>

            <p className="text-center text-xs text-figma-black-40 pt-2">
              회원가입 시{' '}
              <Link to="/terms-of-service" className="text-figma-blue-100 hover:underline font-medium">
                이용약관
              </Link>
              {' '}및{' '}
              <Link to="/privacy-policy" className="text-figma-blue-100 hover:underline font-medium">
                개인정보 처리방침
              </Link>
              에 동의하는 것으로 간주됩니다.
            </p>

            <p className="text-center text-sm text-figma-black-40">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-figma-blue-100 hover:underline font-medium">
                로그인
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;

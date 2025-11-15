import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
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
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.success}>계정이 성공적으로 생성되었습니다!</h2>
          <p style={{ textAlign: 'center' }}>로그인 페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>가족 습관 트래커</h1>
        <h2 style={styles.subtitle}>회원가입</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form} autoComplete="on">
          <div style={styles.formGroup}>
            <label style={styles.label}>아이디</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={styles.input}
              autoComplete="username"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>이메일</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              autoComplete="email"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>표시 이름</label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              style={styles.input}
              autoComplete="name"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>비밀번호</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              autoComplete="new-password"
              required
              minLength="6"
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>

          <p style={styles.link}>
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    padding: 'clamp(12px, 3vw, 20px)',
    boxSizing: 'border-box'
  },
  card: {
    backgroundColor: 'white',
    padding: 'clamp(24px, 5vw, 40px)',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '10px',
    fontSize: 'clamp(20px, 5vw, 28px)'
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 'clamp(20px, 4vw, 30px)',
    fontSize: 'clamp(16px, 4vw, 20px)'
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '20px'
  },
  success: {
    color: '#2a7',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#333',
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  button: {
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  link: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#666'
  }
};

export default Signup;

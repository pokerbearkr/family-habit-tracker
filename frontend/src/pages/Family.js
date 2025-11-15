import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { familyAPI } from '../services/api';

function Family() {
  const { user, logout, updateUserFamily } = useAuth();
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
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

  if (loading) {
    return <div style={styles.container}>로딩 중...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>가족 관리</h1>
        <div style={styles.headerRight}>
          <button onClick={() => navigate('/dashboard')} style={styles.btnSmall}>
            🏠
          </button>
          <button onClick={() => navigate('/monthly')} style={styles.btnSmall}>
            📊
          </button>
          <button onClick={logout} style={styles.btnSmall}>
            🚪
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {family ? (
          <div style={styles.card}>
            <h2 style={styles.familyName}>{family.name}</h2>
            <div style={styles.inviteBox}>
              <p style={styles.inviteLabel}>초대 코드</p>
              <h3 style={styles.inviteCode}>{family.inviteCode}</h3>
              <p style={styles.hint}>가족 구성원과 이 코드를 공유하세요</p>
            </div>

            <div style={styles.membersList}>
              <h3 style={styles.membersTitle}>가족 구성원 ({family.members?.length || 0}명)</h3>
              {family.members?.map((member) => (
                <div key={member.id} style={styles.member}>
                  <span style={styles.memberName}>{member.displayName}</span>
                  <span style={styles.username}>@{member.username}</span>
                </div>
              ))}
            </div>

            <button onClick={handleLeaveFamily} style={styles.dangerButton}>
              가족 떠나기
            </button>
          </div>
        ) : (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>가족 만들기 또는 가입하기</h2>
            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>새 가족 만들기</h3>
              <form onSubmit={handleCreateFamily} style={styles.form}>
                <input
                  type="text"
                  placeholder="가족 이름"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  style={styles.input}
                  required
                />
                <button type="submit" style={styles.button} disabled={submitting}>
                  {submitting ? '생성 중...' : '만들기'}
                </button>
              </form>
            </div>

            <div style={styles.divider}>또는</div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>기존 가족 가입하기</h3>
              <form onSubmit={handleJoinFamily} style={styles.form}>
                <input
                  type="text"
                  placeholder="초대 코드 입력"
                  value={inviteCode}
                  onChange={(e) =>
                    setInviteCode(e.target.value.toUpperCase())
                  }
                  style={styles.input}
                  required
                />
                <button type="submit" style={styles.button} disabled={submitting}>
                  {submitting ? '가입 중...' : '가입하기'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5'
  },
  header: {
    backgroundColor: 'white',
    padding: '12px 16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px'
  },
  headerRight: {
    display: 'flex',
    gap: '6px',
    flexShrink: 0
  },
  title: {
    fontSize: '18px',
    margin: 0,
    whiteSpace: 'nowrap'
  },
  btnSmall: {
    padding: '8px 12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    minWidth: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    padding: 'clamp(20px, 5vw, 40px) clamp(12px, 3vw, 20px)',
    maxWidth: '600px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box'
  },
  card: {
    backgroundColor: 'white',
    padding: 'clamp(20px, 5vw, 40px)',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    boxSizing: 'border-box'
  },
  familyName: {
    fontSize: 'clamp(20px, 5vw, 24px)',
    margin: '0 0 clamp(15px, 4vw, 20px) 0',
    color: '#333',
    wordBreak: 'break-word',
    overflowWrap: 'break-word'
  },
  cardTitle: {
    fontSize: 'clamp(18px, 4.5vw, 22px)',
    margin: '0 0 clamp(15px, 4vw, 20px) 0',
    color: '#333',
    wordBreak: 'break-word',
    overflowWrap: 'break-word'
  },
  inviteBox: {
    backgroundColor: '#f0f8ff',
    padding: 'clamp(15px, 4vw, 20px)',
    borderRadius: '8px',
    textAlign: 'center',
    margin: 'clamp(15px, 4vw, 20px) 0',
    width: '100%',
    boxSizing: 'border-box'
  },
  inviteLabel: {
    margin: '0 0 10px 0',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    color: '#666'
  },
  inviteCode: {
    fontSize: 'clamp(24px, 6vw, 32px)',
    letterSpacing: 'clamp(2px, 1vw, 4px)',
    color: '#007bff',
    margin: '10px 0',
    wordBreak: 'break-all'
  },
  hint: {
    color: '#666',
    fontSize: 'clamp(12px, 3vw, 14px)',
    margin: '10px 0 0 0'
  },
  membersList: {
    margin: 'clamp(20px, 5vw, 30px) 0',
    width: '100%'
  },
  membersTitle: {
    fontSize: 'clamp(16px, 4vw, 18px)',
    marginBottom: '12px',
    color: '#333'
  },
  member: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'clamp(10px, 3vw, 12px)',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
    marginBottom: '8px',
    width: '100%',
    boxSizing: 'border-box',
    gap: '10px'
  },
  memberName: {
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    color: '#333',
    wordBreak: 'break-word',
    flex: 1
  },
  username: {
    color: '#666',
    fontSize: 'clamp(12px, 3vw, 14px)',
    flexShrink: 0,
    whiteSpace: 'nowrap'
  },
  section: {
    margin: 'clamp(20px, 5vw, 30px) 0',
    width: '100%'
  },
  sectionTitle: {
    fontSize: 'clamp(16px, 4vw, 18px)',
    marginBottom: '10px',
    color: '#333'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '15px',
    width: '100%'
  },
  input: {
    width: '100%',
    padding: 'clamp(10px, 2.5vw, 12px)',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    boxSizing: 'border-box'
  },
  button: {
    padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    width: '100%',
    boxSizing: 'border-box'
  },
  dangerButton: {
    padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    width: '100%',
    marginTop: 'clamp(10px, 3vw, 15px)',
    boxSizing: 'border-box'
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: 'clamp(10px, 2.5vw, 12px)',
    borderRadius: '5px',
    marginBottom: '20px',
    fontSize: 'clamp(13px, 3.5vw, 15px)',
    width: '100%',
    boxSizing: 'border-box'
  },
  divider: {
    textAlign: 'center',
    color: '#999',
    margin: 'clamp(20px, 5vw, 30px) 0',
    fontSize: 'clamp(13px, 3.5vw, 14px)',
    fontWeight: 'bold'
  }
};

export default Family;

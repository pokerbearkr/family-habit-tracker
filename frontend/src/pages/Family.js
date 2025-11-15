import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { familyAPI } from '../services/api';

function Family() {
  const { user, logout } = useAuth();
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
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
    setError('');

    try {
      const response = await familyAPI.create(newFamilyName);
      // Update user data in localStorage
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        storedUser.familyId = response.data.id;
        storedUser.familyName = response.data.name;
        localStorage.setItem('user', JSON.stringify(storedUser));
      }
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Create family error:', error);
      const errorMsg = error.response?.data?.message ||
                      error.response?.data?.error ||
                      (typeof error.response?.data === 'string' ? error.response.data : null) ||
                      'Failed to create family';
      setError(errorMsg);
    }
  };

  const handleJoinFamily = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await familyAPI.join(inviteCode);
      // Update user data in localStorage
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        storedUser.familyId = response.data.id;
        storedUser.familyName = response.data.name;
        localStorage.setItem('user', JSON.stringify(storedUser));
      }
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Join family error:', error);
      const errorMsg = error.response?.data?.message ||
                      error.response?.data?.error ||
                      (typeof error.response?.data === 'string' ? error.response.data : null) ||
                      'Failed to join family';
      setError(errorMsg);
    }
  };

  const handleLeaveFamily = async () => {
    if (
      window.confirm(
        'Are you sure you want to leave this family? You will lose access to all shared habits.'
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
                        'Failed to leave family';
        setError(errorMsg);
      }
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
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
            <h2>{family.name}</h2>
            <div style={styles.inviteBox}>
              <p>Invite Code:</p>
              <h3 style={styles.inviteCode}>{family.inviteCode}</h3>
              <p style={styles.hint}>Share this code with family members</p>
            </div>

            <div style={styles.membersList}>
              <h3>Family Members ({family.members?.length || 0})</h3>
              {family.members?.map((member) => (
                <div key={member.id} style={styles.member}>
                  <span>{member.displayName}</span>
                  <span style={styles.username}>@{member.username}</span>
                </div>
              ))}
            </div>

            <button onClick={handleLeaveFamily} style={styles.dangerButton}>
              Leave Family
            </button>
          </div>
        ) : (
          <div style={styles.card}>
            <h2>Join or Create a Family</h2>
            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.section}>
              <h3>Create New Family</h3>
              <form onSubmit={handleCreateFamily} style={styles.form}>
                <input
                  type="text"
                  placeholder="Family name"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  style={styles.input}
                  required
                />
                <button type="submit" style={styles.button}>
                  Create Family
                </button>
              </form>
            </div>

            <div style={styles.divider}>OR</div>

            <div style={styles.section}>
              <h3>Join Existing Family</h3>
              <form onSubmit={handleJoinFamily} style={styles.form}>
                <input
                  type="text"
                  placeholder="Enter invite code"
                  value={inviteCode}
                  onChange={(e) =>
                    setInviteCode(e.target.value.toUpperCase())
                  }
                  style={styles.input}
                  required
                />
                <button type="submit" style={styles.button}>
                  Join Family
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
    padding: '40px 20px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  inviteBox: {
    backgroundColor: '#f0f8ff',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    margin: '20px 0'
  },
  inviteCode: {
    fontSize: '32px',
    letterSpacing: '4px',
    color: '#007bff',
    margin: '10px 0'
  },
  hint: {
    color: '#666',
    fontSize: '14px'
  },
  membersList: {
    margin: '30px 0'
  },
  member: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
    marginBottom: '8px'
  },
  username: {
    color: '#666',
    fontSize: '14px'
  },
  section: {
    margin: '30px 0'
  },
  form: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px'
  },
  input: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '16px'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  dangerButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    width: '100%'
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '20px'
  },
  divider: {
    textAlign: 'center',
    color: '#999',
    margin: '30px 0',
    fontSize: '14px',
    fontWeight: 'bold'
  }
};

export default Family;

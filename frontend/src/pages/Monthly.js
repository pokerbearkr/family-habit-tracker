import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { habitLogAPI } from '../services/api';

function Monthly() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  useEffect(() => {
    loadMonthlyStats();
  }, [selectedDate]);

  const loadMonthlyStats = async () => {
    try {
      setLoading(true);
      const response = await habitLogAPI.getMonthlyStats(
        selectedDate.year,
        selectedDate.month
      );
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading monthly stats:', error);
      setLoading(false);
    }
  };

  const changeMonth = (delta) => {
    const newDate = new Date(selectedDate.year, selectedDate.month - 1 + delta, 1);
    setSelectedDate({
      year: newDate.getFullYear(),
      month: newDate.getMonth() + 1
    });
  };

  const getMonthName = () => {
    return new Date(selectedDate.year, selectedDate.month - 1, 1).toLocaleDateString(
      'ko-KR',
      { year: 'numeric', month: 'long' }
    );
  };

  if (!user.familyId) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>가족에 가입해주세요</h2>
          <p>월간 통계를 보려면 가족에 속해 있어야 합니다.</p>
          <button onClick={() => navigate('/family')} style={styles.button}>
            가족 관리
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={styles.container}>로딩 중...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>월간 요약</h1>
        <div style={styles.headerRight}>
          <button onClick={() => navigate('/dashboard')} style={styles.btnSmall}>
            🏠
          </button>
          <button onClick={() => navigate('/family')} style={styles.btnSmall}>
            👨‍👩‍👧‍👦
          </button>
          <button onClick={logout} style={styles.btnSmall}>
            🚪
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Month Selector */}
        <div style={styles.monthSelector}>
          <button onClick={() => changeMonth(-1)} style={styles.navButton}>
            ◀
          </button>
          <h2 style={styles.monthTitle}>{getMonthName()}</h2>
          <button onClick={() => changeMonth(1)} style={styles.navButton}>
            ▶
          </button>
        </div>

        {stats && (
          <>
            {/* User Stats */}
            <div style={styles.section}>
              <h3>가족 구성원별 통계</h3>
              <div style={styles.statsGrid}>
                {stats.userStats.map((userStat) => (
                  <div key={userStat.userId} style={styles.statCard}>
                    <div style={styles.statHeader}>
                      <h4>{userStat.displayName}</h4>
                      <span style={styles.percentage}>
                        {userStat.completionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${userStat.completionRate}%`
                        }}
                      />
                    </div>
                    <p style={styles.statDetail}>
                      {userStat.completedCount} / {userStat.totalPossible} 완료
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Habit Stats */}
            <div style={styles.section}>
              <h3>습관별 통계</h3>
              <div style={styles.statsGrid}>
                {stats.habitStats.map((habitStat) => (
                  <div key={habitStat.habitId} style={styles.statCard}>
                    <div style={styles.statHeader}>
                      <h4 style={{ color: habitStat.color }}>
                        {habitStat.habitName}
                      </h4>
                      <span style={styles.percentage}>
                        {habitStat.completionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          backgroundColor: habitStat.color,
                          width: `${habitStat.completionRate}%`
                        }}
                      />
                    </div>
                    <p style={styles.statDetail}>
                      {habitStat.completedCount} / {habitStat.totalPossible} 완료
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar View */}
            <div style={styles.section}>
              <h3>월간 캘린더</h3>
              <div style={styles.calendar}>
                {Object.entries(stats.dailyStats)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dateKey, dayStat]) => {
                    const date = new Date(dateKey);
                    const dayOfWeek = date.getDay();
                    const completionRate =
                      dayStat.totalHabits > 0
                        ? (dayStat.completedCount / dayStat.totalHabits) * 100
                        : 0;

                    let bgColor = '#f8f9fa';
                    if (completionRate >= 80) bgColor = '#d4edda';
                    else if (completionRate >= 50) bgColor = '#fff3cd';
                    else if (completionRate > 0) bgColor = '#f8d7da';

                    return (
                      <div
                        key={dateKey}
                        style={{
                          ...styles.calendarDay,
                          backgroundColor: bgColor,
                          gridColumnStart: date.getDate() === 1 ? dayOfWeek + 1 : 'auto'
                        }}
                        title={`${dayStat.completedCount}/${dayStat.totalHabits} 완료`}
                      >
                        <div style={styles.dayNumber}>{date.getDate()}</div>
                        <div style={styles.dayCompletion}>
                          {dayStat.completedCount}/{dayStat.totalHabits}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div style={styles.legend}>
                <span style={styles.legendItem}>
                  <span style={{ ...styles.legendColor, backgroundColor: '#d4edda' }} />
                  80% 이상
                </span>
                <span style={styles.legendItem}>
                  <span style={{ ...styles.legendColor, backgroundColor: '#fff3cd' }} />
                  50-79%
                </span>
                <span style={styles.legendItem}>
                  <span style={{ ...styles.legendColor, backgroundColor: '#f8d7da' }} />
                  1-49%
                </span>
                <span style={styles.legendItem}>
                  <span style={{ ...styles.legendColor, backgroundColor: '#f8f9fa' }} />
                  0%
                </span>
              </div>
            </div>
          </>
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
    padding: 'clamp(12px, 3vw, 24px)',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box'
  },
  monthSelector: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 'clamp(10px, 3vw, 20px)',
    marginBottom: 'clamp(16px, 4vw, 30px)',
    backgroundColor: 'white',
    padding: 'clamp(12px, 3vw, 20px)',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    width: '100%',
    boxSizing: 'border-box'
  },
  monthTitle: {
    margin: 0,
    minWidth: '120px',
    textAlign: 'center',
    fontSize: 'clamp(16px, 4vw, 20px)',
    whiteSpace: 'nowrap'
  },
  navButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '18px'
  },
  section: {
    backgroundColor: 'white',
    padding: 'clamp(12px, 3vw, 20px)',
    marginBottom: 'clamp(12px, 3vw, 20px)',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    width: '100%',
    boxSizing: 'border-box'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
    gap: 'clamp(8px, 2vw, 15px)',
    marginTop: '12px'
  },
  statCard: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  percentage: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#007bff'
  },
  progressBar: {
    height: '10px',
    backgroundColor: '#e9ecef',
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
    transition: 'width 0.3s ease'
  },
  statDetail: {
    margin: 0,
    fontSize: '14px',
    color: '#666'
  },
  calendar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 'clamp(2px, 1vw, 8px)',
    marginTop: '15px',
    width: '100%',
    maxWidth: '100%'
  },
  calendarDay: {
    aspectRatio: '1',
    padding: 'clamp(2px, 1.5vw, 10px)',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    minWidth: 0,
    overflow: 'hidden'
  },
  dayNumber: {
    fontWeight: 'bold',
    fontSize: 'clamp(10px, 2.5vw, 16px)',
    marginBottom: '2px',
    lineHeight: 1
  },
  dayCompletion: {
    fontSize: 'clamp(8px, 2vw, 12px)',
    color: '#666',
    whiteSpace: 'nowrap',
    lineHeight: 1
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '12px',
    flexWrap: 'wrap'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px'
  },
  legendColor: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: '1px solid #dee2e6'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    margin: '40px auto',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    textAlign: 'center'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default Monthly;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { habitAPI, habitLogAPI, familyAPI, pushAPI } from '../services/api';
import websocketService from '../services/websocket';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// SortableHabitItem component for drag and drop
function SortableHabitItem({ habit, userLog, onToggle, onEdit, onDelete, daysDisplay }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <div
        style={{
          ...styles.habitCard,
          borderLeft: `4px solid ${habit.color}`
        }}
      >
        <div style={styles.habitHeader}>
          <div style={styles.habitTitleContainer}>
            <div
              {...listeners}
              style={styles.dragHandle}
              title="드래그하여 순서 변경"
            >
              ☰
            </div>
            <div>
              <h3 style={styles.habitName}>{habit.name}</h3>
              {daysDisplay && <span style={styles.daysLabel}>({daysDisplay})</span>}
            </div>
          </div>
          <div style={styles.habitActions}>
            <button
              onClick={() => onToggle(habit.id)}
              style={{
                ...styles.checkButton,
                backgroundColor: userLog?.completed
                  ? habit.color
                  : '#ddd'
              }}
            >
              {userLog?.completed ? '✓' : '○'}
            </button>
          </div>
        </div>
        {habit.description && <p style={styles.description}>{habit.description}</p>}
        <div style={styles.habitButtonGroup}>
          <button
            onClick={() => onEdit(habit)}
            style={styles.editButton}
          >
            수정
          </button>
          <button
            onClick={() => onDelete(habit.id)}
            style={styles.deleteButton}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [family, setFamily] = useState(null);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    color: '#007bff',
    habitType: 'DAILY',
    selectedDays: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  // Define functions first
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPushNotifications = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported');
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Get VAPID public key from server
        const { data } = await pushAPI.getVapidPublicKey();
        const vapidPublicKey = data.publicKey;

        // Convert VAPID key from base64 to Uint8Array
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        // Subscribe to push notifications
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        console.log('New push subscription created');
      } else {
        console.log('Already subscribed to push notifications');
      }

      // Send subscription to server (always send to ensure it's saved)
      // Convert subscription to JSON format
      const subscriptionData = subscription.toJSON();
      await pushAPI.subscribe(subscriptionData);
      console.log('Push notification subscription sent to server');
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      console.log('브라우저가 알림을 지원하지 않습니다.');
      return;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      // If permission granted, subscribe to push notifications
      if (permission === 'granted') {
        await subscribeToPushNotifications();
      }
    }
  };

  useEffect(() => {
    loadData();
    // Request notification permission and subscribe on mount
    requestNotificationPermission();
    // Also try to subscribe if already granted
    if (Notification.permission === 'granted') {
      subscribeToPushNotifications();
    }
  }, []);

  // Poll for updates every 30 seconds to check for new habit completions
  useEffect(() => {
    if (!user.familyId) return;

    const interval = setInterval(() => {
      loadData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user.familyId, logs]);

  // WebSocket disabled - uncomment to enable real-time updates
  // useEffect(() => {
  //   if (user && user.familyId) {
  //     websocketService.connect(user.familyId, handleWebSocketMessage);
  //     return () => websocketService.disconnect();
  //   }
  // }, [user]);

  const showNotification = (title, body) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return;
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Use service worker for notification
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: 'habit-check',
          requireInteraction: false,
          vibrate: [200, 100, 200]
        });
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        body,
        icon: '/logo192.png',
        tag: 'habit-check',
        requireInteraction: false
      });
    }
  };

  const loadData = async () => {
    try {
      setError('');
      if (user.familyId) {
        const [habitsRes, logsRes, familyRes] = await Promise.all([
          habitAPI.getAll(),
          habitLogAPI.getFamilyLogs(today),
          familyAPI.getMy()
        ]);

        // Check for new habit completions and show notifications
        if (logs.length > 0) {
          const newLogs = logsRes.data.filter(newLog =>
            newLog.completed &&
            newLog.user.id !== user.id &&
            !logs.find(oldLog => oldLog.id === newLog.id && oldLog.completed)
          );

          newLogs.forEach(log => {
            showNotification(
              `${log.user.displayName}님이 습관을 완료했습니다!`,
              `"${log.habit.name}" 습관을 체크했습니다.`
            );
          });
        }

        setHabits(habitsRes.data);
        setLogs(logsRes.data);
        setFamily(familyRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('데이터를 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleWebSocketMessage = (update) => {
    console.log('Received update:', update);
    loadData(); // Reload data when update received
  };

  const handleToggleHabit = async (habitId) => {
    const existingLog = logs.find(
      (log) => log.habit.id === habitId && log.user.id === user.id
    );

    try {
      await habitLogAPI.log(
        habitId,
        today,
        existingLog ? !existingLog.completed : true,
        ''
      );
      loadData();
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    try {
      const selectedDaysStr = newHabit.habitType === 'WEEKLY' && newHabit.selectedDays.length > 0
        ? newHabit.selectedDays.join(',')
        : null;

      await habitAPI.create(
        newHabit.name,
        newHabit.description,
        newHabit.color,
        newHabit.habitType,
        selectedDaysStr
      );
      setNewHabit({ name: '', description: '', color: '#007bff', habitType: 'DAILY', selectedDays: [] });
      setShowAddHabit(false);
      loadData();
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  };

  const handleEditHabit = (habit) => {
    setEditingHabit(habit);
    setNewHabit({
      name: habit.name,
      description: habit.description || '',
      color: habit.color,
      habitType: habit.habitType || 'DAILY',
      selectedDays: habit.selectedDays ? habit.selectedDays.split(',').map(d => parseInt(d)) : []
    });
    setShowAddHabit(false);
  };

  const handleUpdateHabit = async (e) => {
    e.preventDefault();
    try {
      const selectedDaysStr = newHabit.habitType === 'WEEKLY' && newHabit.selectedDays.length > 0
        ? newHabit.selectedDays.join(',')
        : null;

      await habitAPI.update(
        editingHabit.id,
        newHabit.name,
        newHabit.description,
        newHabit.color,
        newHabit.habitType,
        selectedDaysStr
      );
      setNewHabit({ name: '', description: '', color: '#007bff', habitType: 'DAILY', selectedDays: [] });
      setEditingHabit(null);
      loadData();
    } catch (error) {
      console.error('Error updating habit:', error);
      alert('습관 수정에 실패했습니다: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (window.confirm('정말 이 습관을 삭제하시겠습니까?')) {
      try {
        await habitAPI.delete(habitId);
        loadData();
      } catch (error) {
        console.error('Error deleting habit:', error);
        alert('습관 삭제에 실패했습니다: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const myHabits = habits
        .filter(habit => habit.userId === user.id)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

      const oldIndex = myHabits.findIndex(h => h.id === active.id);
      const newIndex = myHabits.findIndex(h => h.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedHabits = arrayMove(myHabits, oldIndex, newIndex);

        // Update displayOrder for all affected habits
        try {
          const updates = reorderedHabits.map((habit, index) => ({
            id: habit.id,
            displayOrder: index
          }));

          // Update local state immediately for smooth UX
          const newHabits = habits.map(habit => {
            const update = updates.find(u => u.id === habit.id);
            return update ? { ...habit, displayOrder: update.displayOrder } : habit;
          });
          setHabits(newHabits);

          // Send to backend
          await habitAPI.reorderBatch(updates);
        } catch (error) {
          console.error('Error reordering habits:', error);
          alert('습관 순서 변경에 실패했습니다.');
          loadData(); // Reload on error
        }
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingHabit(null);
    setNewHabit({ name: '', description: '', color: '#007bff', habitType: 'DAILY', selectedDays: [] });
  };

  const toggleDaySelection = (dayNumber) => {
    setNewHabit(prev => {
      const days = [...prev.selectedDays];
      const index = days.indexOf(dayNumber);
      if (index > -1) {
        days.splice(index, 1);
      } else {
        days.push(dayNumber);
      }
      return { ...prev, selectedDays: days.sort((a, b) => a - b) };
    });
  };

  // Check if a habit should be shown today
  const isHabitForToday = (habit) => {
    if (habit.habitType === 'DAILY' || !habit.habitType) {
      return true; // Daily habits always show
    }

    if (habit.habitType === 'WEEKLY' && habit.selectedDays) {
      const todayDayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const adjustedDay = todayDayOfWeek === 0 ? 7 : todayDayOfWeek; // Convert to 1=Mon, 7=Sun
      const selectedDaysArray = habit.selectedDays.split(',').map(d => parseInt(d));
      return selectedDaysArray.includes(adjustedDay);
    }

    return true; // Default to showing if type is unknown
  };

  // Get display text for selected days
  const getDaysDisplay = (habit) => {
    if (habit.habitType !== 'WEEKLY' || !habit.selectedDays) {
      return null;
    }

    const dayNames = { 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토', 7: '일' };
    const selectedDaysArray = habit.selectedDays.split(',').map(d => parseInt(d));
    return selectedDaysArray.map(d => dayNames[d]).join('/');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user.familyId) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>환영합니다, {user.displayName}님!</h2>
          <p>습관 추적을 시작하려면 가족을 만들거나 가입해야 합니다.</p>
          <button onClick={() => navigate('/family')} style={styles.button}>
            가족 관리
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>습관 트래커</h1>
          <span style={styles.userName}>{user.displayName}</span>
        </div>
        <div style={styles.headerRight}>
          <button onClick={() => navigate('/monthly')} style={styles.btnSmall}>
            📊
          </button>
          <button onClick={() => navigate('/family')} style={styles.btnSmall}>
            👨‍👩‍👧‍👦
          </button>
          <button onClick={logout} style={styles.btnSmall}>
            🚪
          </button>
        </div>
      </div>

      {family && (
        <div style={styles.familyInfo}>
          <h3 style={styles.familyInfoTitle}>{family.name}</h3>
          <p>구성원: {family.members?.length || 0}명</p>
        </div>
      )}

      <div style={styles.content}>
        {error && <div style={styles.errorMessage}>{error}</div>}

        {/* Notification Permission Banner */}
        {notificationPermission !== 'granted' && notificationPermission !== 'denied' && (
          <div style={styles.notificationBanner}>
            <p style={styles.notificationText}>
              가족 구성원이 습관을 체크하면 알림을 받으시겠어요?
            </p>
            <button onClick={requestNotificationPermission} style={styles.notificationButton}>
              알림 켜기
            </button>
          </div>
        )}

        {/* My Habits Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>내 습관</h2>
            <button
              onClick={() => {
                setShowAddHabit(!showAddHabit);
                setEditingHabit(null);
                setNewHabit({ name: '', description: '', color: '#007bff' });
              }}
              style={styles.button}
            >
              {showAddHabit ? '취소' : '습관 추가'}
            </button>
          </div>

          {showAddHabit && (
            <form onSubmit={handleAddHabit} style={styles.form}>
              <input
                type="text"
                placeholder="습관 이름"
                value={newHabit.name}
                onChange={(e) =>
                  setNewHabit({ ...newHabit, name: e.target.value })
                }
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="설명 (선택사항)"
                value={newHabit.description}
                onChange={(e) =>
                  setNewHabit({ ...newHabit, description: e.target.value })
                }
                style={styles.input}
              />
              <input
                type="color"
                value={newHabit.color}
                onChange={(e) =>
                  setNewHabit({ ...newHabit, color: e.target.value })
                }
                style={styles.colorInput}
              />

              <div style={styles.habitTypeContainer}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    value="DAILY"
                    checked={newHabit.habitType === 'DAILY'}
                    onChange={(e) => setNewHabit({ ...newHabit, habitType: e.target.value })}
                  />
                  매일
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    value="WEEKLY"
                    checked={newHabit.habitType === 'WEEKLY'}
                    onChange={(e) => setNewHabit({ ...newHabit, habitType: e.target.value })}
                  />
                  주간 (요일 선택)
                </label>
              </div>

              {newHabit.habitType === 'WEEKLY' && (
                <div style={styles.daysSelector}>
                  {[
                    { num: 1, label: '월' },
                    { num: 2, label: '화' },
                    { num: 3, label: '수' },
                    { num: 4, label: '목' },
                    { num: 5, label: '금' },
                    { num: 6, label: '토' },
                    { num: 7, label: '일' }
                  ].map(day => (
                    <button
                      key={day.num}
                      type="button"
                      onClick={() => toggleDaySelection(day.num)}
                      style={{
                        ...styles.dayButton,
                        backgroundColor: newHabit.selectedDays.includes(day.num) ? '#007bff' : '#f0f0f0',
                        color: newHabit.selectedDays.includes(day.num) ? 'white' : '#333'
                      }}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              )}

              <button type="submit" style={styles.button}>
                생성
              </button>
            </form>
          )}

          {editingHabit && (
            <form onSubmit={handleUpdateHabit} style={styles.form}>
              <input
                type="text"
                placeholder="습관 이름"
                value={newHabit.name}
                onChange={(e) =>
                  setNewHabit({ ...newHabit, name: e.target.value })
                }
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="설명 (선택사항)"
                value={newHabit.description}
                onChange={(e) =>
                  setNewHabit({ ...newHabit, description: e.target.value })
                }
                style={styles.input}
              />
              <input
                type="color"
                value={newHabit.color}
                onChange={(e) =>
                  setNewHabit({ ...newHabit, color: e.target.value })
                }
                style={styles.colorInput}
              />

              <div style={styles.habitTypeContainer}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    value="DAILY"
                    checked={newHabit.habitType === 'DAILY'}
                    onChange={(e) => setNewHabit({ ...newHabit, habitType: e.target.value })}
                  />
                  매일
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    value="WEEKLY"
                    checked={newHabit.habitType === 'WEEKLY'}
                    onChange={(e) => setNewHabit({ ...newHabit, habitType: e.target.value })}
                  />
                  주간 (요일 선택)
                </label>
              </div>

              {newHabit.habitType === 'WEEKLY' && (
                <div style={styles.daysSelector}>
                  {[
                    { num: 1, label: '월' },
                    { num: 2, label: '화' },
                    { num: 3, label: '수' },
                    { num: 4, label: '목' },
                    { num: 5, label: '금' },
                    { num: 6, label: '토' },
                    { num: 7, label: '일' }
                  ].map(day => (
                    <button
                      key={day.num}
                      type="button"
                      onClick={() => toggleDaySelection(day.num)}
                      style={{
                        ...styles.dayButton,
                        backgroundColor: newHabit.selectedDays.includes(day.num) ? '#007bff' : '#f0f0f0',
                        color: newHabit.selectedDays.includes(day.num) ? 'white' : '#333'
                      }}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              )}

              <button type="submit" style={styles.button}>
                수정
              </button>
              <button type="button" onClick={handleCancelEdit} style={styles.cancelButton}>
                취소
              </button>
            </form>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={habits
                .filter(habit => habit.userId === user.id)
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map(h => h.id)}
              strategy={verticalListSortingStrategy}
            >
              <div style={styles.habitsList}>
                {habits
                  .filter(habit => habit.userId === user.id && isHabitForToday(habit))
                  .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                  .map((habit) => {
                    const userLog = logs.find(
                      (log) => log.habit.id === habit.id && log.user.id === user.id
                    );
                    const daysDisplay = getDaysDisplay(habit);

                    return (
                      <SortableHabitItem
                        key={habit.id}
                        habit={habit}
                        userLog={userLog}
                        onToggle={handleToggleHabit}
                        onEdit={handleEditHabit}
                        onDelete={handleDeleteHabit}
                        daysDisplay={daysDisplay}
                      />
                    );
                  })}
                {habits.filter(habit => habit.userId === user.id && isHabitForToday(habit)).length === 0 && (
                  <p style={styles.emptyMessage}>오늘 할 습관이 없습니다!</p>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Family Members' Habits Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>가족 구성원의 습관</h2>
          </div>

          <div style={styles.habitsList}>
            {habits
              .filter(habit => habit.userId !== user.id && isHabitForToday(habit))
              .map((habit) => {
                const habitLog = logs.find(
                  (log) => log.habit.id === habit.id
                );
                const isCompleted = habitLog?.completed || false;
                const daysDisplay = getDaysDisplay(habit);

                return (
                  <div
                    key={habit.id}
                    style={{
                      ...styles.habitCard,
                      borderLeft: `4px solid ${habit.color}`,
                      opacity: 0.85
                    }}
                  >
                    <div style={styles.habitHeader}>
                      <div style={styles.habitInfo}>
                        <div>
                          <h3 style={styles.habitName}>{habit.name}</h3>
                          {daysDisplay && <span style={styles.daysLabel}>({daysDisplay})</span>}
                        </div>
                        <p style={styles.habitOwner}>{habit.userDisplayName}님의 습관</p>
                      </div>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: isCompleted ? habit.color : '#ddd'
                        }}
                      >
                        {isCompleted ? '✓' : '○'}
                      </span>
                    </div>
                    {habit.description && <p style={styles.description}>{habit.description}</p>}
                  </div>
                );
              })}
            {habits.filter(habit => habit.userId !== user.id && isHabitForToday(habit)).length === 0 && (
              <p style={styles.emptyMessage}>오늘 다른 가족 구성원의 습관이 없습니다.</p>
            )}
          </div>
        </div>
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
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    minWidth: 0
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
  userName: {
    fontSize: '14px',
    color: '#666',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
  familyInfo: {
    backgroundColor: 'white',
    margin: 'clamp(12px, 3vw, 20px)',
    padding: 'clamp(12px, 3vw, 20px)',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    width: 'calc(100% - clamp(24px, 6vw, 40px))',
    boxSizing: 'border-box',
    overflow: 'hidden'
  },
  familyInfoTitle: {
    margin: '0 0 8px 0',
    wordBreak: 'break-word',
    overflowWrap: 'break-word'
  },
  content: {
    padding: 'clamp(12px, 3vw, 24px)',
    width: '100%',
    boxSizing: 'border-box'
  },
  section: {
    backgroundColor: 'white',
    padding: 'clamp(12px, 3vw, 20px)',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: 'clamp(12px, 3vw, 20px)',
    width: '100%',
    boxSizing: 'border-box'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(12px, 3vw, 15px)',
    marginBottom: '20px',
    width: '100%',
    boxSizing: 'border-box'
  },
  input: {
    width: '100%',
    padding: 'clamp(8px, 2vw, 10px)',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    boxSizing: 'border-box'
  },
  colorInput: {
    width: 'clamp(50px, 15vw, 60px)',
    height: 'clamp(36px, 10vw, 40px)',
    border: '1px solid #ddd',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  habitTypeContainer: {
    display: 'flex',
    gap: 'clamp(12px, 3vw, 20px)',
    marginBottom: '15px',
    flexWrap: 'wrap',
    width: '100%'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
    fontSize: 'clamp(13px, 3.5vw, 14px)',
    whiteSpace: 'nowrap'
  },
  daysSelector: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(45px, 1fr))',
    gap: 'clamp(6px, 2vw, 8px)',
    marginBottom: '15px',
    width: '100%'
  },
  dayButton: {
    padding: 'clamp(8px, 2vw, 10px) clamp(6px, 1.5vw, 8px)',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: 'clamp(12px, 3vw, 14px)',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    minHeight: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
  habitsList: {
    display: 'grid',
    gap: '15px'
  },
  habitCard: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    borderLeft: '4px solid #007bff',
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden'
  },
  habitHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0
  },
  habitInfo: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden'
  },
  habitTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    minWidth: 0
  },
  dragHandle: {
    cursor: 'grab',
    padding: '4px 8px',
    color: '#999',
    fontSize: '20px',
    userSelect: 'none',
    touchAction: 'none'
  },
  habitName: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    maxWidth: '100%'
  },
  daysLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: 'normal'
  },
  checkButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: 'white',
    fontWeight: 'bold'
  },
  description: {
    color: '#666',
    fontSize: '14px',
    margin: '8px 0',
    wordBreak: 'break-word',
    overflowWrap: 'break-word'
  },
  familySection: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #e9ecef'
  },
  familyTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: '10px'
  },
  familyProgress: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
    flexWrap: 'wrap'
  },
  memberItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  memberBadge: {
    padding: '4px 12px',
    borderRadius: '15px',
    fontSize: '12px',
    color: 'white',
    fontWeight: 'bold'
  },
  memberName: {
    fontSize: '13px',
    color: '#495057'
  },
  habitOwner: {
    fontSize: '12px',
    color: '#6c757d',
    margin: '4px 0 0 0',
    fontWeight: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'break-word'
  },
  statusBadge: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    color: 'white',
    fontWeight: 'bold'
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#6c757d',
    padding: '20px',
    fontStyle: 'italic'
  },
  habitActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  habitButtonGroup: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px'
  },
  editButton: {
    flex: 1,
    padding: '6px 10px',
    backgroundColor: 'transparent',
    color: '#6c757d',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'normal'
  },
  deleteButton: {
    flex: 1,
    padding: '6px 10px',
    backgroundColor: 'transparent',
    color: '#6c757d',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'normal'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
    fontSize: '18px',
    color: '#666'
  },
  errorMessage: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  cancelButton: {
    padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    width: '100%',
    boxSizing: 'border-box',
    marginTop: '10px'
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
  notificationBanner: {
    backgroundColor: '#e7f3ff',
    border: '1px solid #007bff',
    borderRadius: '8px',
    padding: 'clamp(12px, 3vw, 16px)',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    boxSizing: 'border-box'
  },
  notificationText: {
    margin: 0,
    color: '#333',
    fontSize: 'clamp(13px, 3.5vw, 15px)',
    textAlign: 'center'
  },
  notificationButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 'clamp(13px, 3.5vw, 14px)'
  }
};

export default Dashboard;

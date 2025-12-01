import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { habitAPI, habitLogAPI, familyAPI, pushAPI } from '../services/api';
import websocketService from '../services/websocket';
import toast, { Toaster } from 'react-hot-toast';
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
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import {
  Plus,
  Edit,
  Trash2,
  Check,
  GripVertical,
  Calendar,
  Users,
  LogOut,
  TrendingUp,
  Bell,
  Circle,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

// SortableHabitItem component for drag and drop
function SortableHabitItem({ habit, userLog, onToggle, onEdit, onDelete, daysDisplay, weeklyProgress }) {
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
      <Card className="hover:shadow-md transition-shadow" style={{ borderLeft: `4px solid ${habit.color}` }}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <div
                {...listeners}
                className="cursor-grab active:cursor-grabbing mt-1 text-gray-400 hover:text-gray-600"
                style={{ touchAction: 'none' }}
                title="드래그하여 순서 변경"
              >
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg break-words">{habit.name}</h3>
                  {habit.currentStreak > 0 && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      habit.currentStreak >= 30 ? 'bg-orange-100 text-orange-700' :
                      habit.currentStreak >= 7 ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      🔥 {habit.currentStreak}일
                    </span>
                  )}
                </div>
                {daysDisplay && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {daysDisplay}
                  </Badge>
                )}
                {weeklyProgress && (
                  <Badge
                    variant={weeklyProgress.completed >= weeklyProgress.target ? "default" : "secondary"}
                    className="mt-1 ml-1 text-xs"
                  >
                    이번 주 {weeklyProgress.completed}/{weeklyProgress.target}
                  </Badge>
                )}
                {habit.description && (
                  <p className="text-sm text-gray-600 mt-2 break-words">{habit.description}</p>
                )}
                {userLog?.completed && userLog?.completedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    ✓ {new Date(userLog.completedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                {userLog?.note && (
                  <div className="flex items-start gap-1 mt-2 p-2 bg-gray-50 rounded-md">
                    <MessageSquare className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600 break-words">{userLog.note}</p>
                  </div>
                )}
              </div>
            </div>
            <Button
              onClick={() => onToggle(habit.id)}
              size="icon"
              className="rounded-full w-12 h-12 flex-shrink-0"
              style={{
                backgroundColor: userLog?.completed ? habit.color : '#e5e7eb',
                color: 'white'
              }}
            >
              {userLog?.completed ? <Check className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => onEdit(habit)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              수정
            </Button>
            <Button
              onClick={() => onDelete(habit)}
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              삭제
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [family, setFamily] = useState(null);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  // Get last used color from localStorage, default to blue if not found
  const getLastUsedColor = () => {
    return localStorage.getItem('lastHabitColor') || '#007bff';
  };

  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    color: getLastUsedColor(),
    habitType: 'DAILY',
    selectedDays: [],
    weeklyTarget: 3
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showMemoDialog, setShowMemoDialog] = useState(false);
  const [memoHabit, setMemoHabit] = useState(null);
  const [memoText, setMemoText] = useState('');
  const [memoExistingLog, setMemoExistingLog] = useState(null);
  const navigate = useNavigate();

  // Get this week's start (Monday) and end (Sunday) dates
  const getWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return { start: formatDate(monday), end: formatDate(sunday) };
  };

  // Get today's date in local timezone (not UTC)
  const getTodayLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Selected date state (starts with today)
  const [selectedDate, setSelectedDate] = useState(getTodayLocal());

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
  }, [selectedDate]); // Reload data when selected date changes

  useEffect(() => {
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
      loadData(true); // Pass true to enable notification checks
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

  const loadData = async (checkForNotifications = false) => {
    try {
      setError('');
      if (user.familyId) {
        const weekRange = getWeekRange();
        const [habitsRes, logsRes, familyRes, weeklyLogsRes] = await Promise.all([
          habitAPI.getAll(),
          habitLogAPI.getFamilyLogs(selectedDate),
          familyAPI.getMy(),
          habitLogAPI.getFamilyLogsRange(weekRange.start, weekRange.end)
        ]);

        // Check for new habit completions and show notifications
        // Only when explicitly checking (polling) and viewing today's date
        if (checkForNotifications && logs.length > 0 && selectedDate === getTodayLocal()) {
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
        setWeeklyLogs(weeklyLogsRes.data);
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
    const habit = habits.find(h => h.id === habitId);

    if (!existingLog?.completed) {
      // 체크하려고 할 때 - 메모 다이얼로그 열기
      setMemoHabit(habit);
      setMemoText(existingLog?.note || '');
      setMemoExistingLog(existingLog);
      setShowMemoDialog(true);
    } else {
      // 체크 해제할 때 - 바로 토글
      try {
        await habitLogAPI.log(habitId, selectedDate, false, existingLog?.note || '');
        loadData();
      } catch (error) {
        console.error('Error toggling habit:', error);
      }
    }
  };

  const handleMemoSubmit = async (withMemo = true) => {
    if (!memoHabit) return;

    try {
      await habitLogAPI.log(
        memoHabit.id,
        selectedDate,
        true,
        withMemo ? memoText : ''
      );
      setShowMemoDialog(false);
      setMemoHabit(null);
      setMemoText('');
      setMemoExistingLog(null);
      loadData();
    } catch (error) {
      console.error('Error logging habit:', error);
      toast.error('습관 체크에 실패했습니다.');
    }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    try {
      const selectedDaysStr = newHabit.habitType === 'WEEKLY' && newHabit.selectedDays.length > 0
        ? newHabit.selectedDays.join(',')
        : null;

      const weeklyTarget = newHabit.habitType === 'WEEKLY_COUNT' ? newHabit.weeklyTarget : null;

      await habitAPI.create(
        newHabit.name,
        newHabit.description,
        newHabit.color,
        newHabit.habitType,
        selectedDaysStr,
        weeklyTarget
      );

      // Save the last used color to localStorage
      localStorage.setItem('lastHabitColor', newHabit.color);

      setNewHabit({ name: '', description: '', color: newHabit.color, habitType: 'DAILY', selectedDays: [], weeklyTarget: 3 });
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
      selectedDays: habit.selectedDays ? habit.selectedDays.split(',').map(d => parseInt(d)) : [],
      weeklyTarget: habit.weeklyTarget || 3
    });
    setShowAddHabit(false);
  };

  const handleUpdateHabit = async (e) => {
    e.preventDefault();
    try {
      const selectedDaysStr = newHabit.habitType === 'WEEKLY' && newHabit.selectedDays.length > 0
        ? newHabit.selectedDays.join(',')
        : null;

      const weeklyTarget = newHabit.habitType === 'WEEKLY_COUNT' ? newHabit.weeklyTarget : null;

      await habitAPI.update(
        editingHabit.id,
        newHabit.name,
        newHabit.description,
        newHabit.color,
        newHabit.habitType,
        selectedDaysStr,
        weeklyTarget
      );

      // Save the last used color to localStorage
      localStorage.setItem('lastHabitColor', newHabit.color);

      setNewHabit({ name: '', description: '', color: getLastUsedColor(), habitType: 'DAILY', selectedDays: [], weeklyTarget: 3 });
      setEditingHabit(null);
      loadData();
    } catch (error) {
      console.error('Error updating habit:', error);
      toast.error('습관 수정에 실패했습니다: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteHabit = (habit) => {
    setHabitToDelete(habit);
    setShowDeleteDialog(true);
  };

  const confirmDeleteHabit = async () => {
    if (!habitToDelete) return;

    try {
      await habitAPI.delete(habitToDelete.id);
      setShowDeleteDialog(false);
      setHabitToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast.error('습관 삭제에 실패했습니다: ' + (error.response?.data?.message || error.message));
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
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
          toast.error('습관 순서 변경에 실패했습니다.');
          loadData(); // Reload on error
        }
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingHabit(null);
    setNewHabit({ name: '', description: '', color: getLastUsedColor(), habitType: 'DAILY', selectedDays: [] });
  };

  const toggleDaySelection = (dayNumber) => {
    setNewHabit(prev => {
      const currentDays = Array.isArray(prev.selectedDays) ? prev.selectedDays : [];
      const days = [...currentDays];
      const index = days.indexOf(dayNumber);
      if (index > -1) {
        days.splice(index, 1);
      } else {
        days.push(dayNumber);
      }
      return { ...prev, selectedDays: days.sort((a, b) => a - b) };
    });
  };

  // Date navigation functions
  const changeDate = (days) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);

    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newDay = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${newYear}-${newMonth}-${newDay}`);
  };

  const goToToday = () => {
    setSelectedDate(getTodayLocal());
  };

  const formatSelectedDate = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = getTodayLocal();

    if (selectedDate === today) {
      return '오늘';
    }

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // Check if a habit should be shown for selected date
  const isHabitForToday = (habit) => {
    if (habit.habitType === 'DAILY' || !habit.habitType) {
      return true; // Daily habits always show
    }

    if (habit.habitType === 'WEEKLY_COUNT') {
      return true; // Weekly count habits can be done any day
    }

    if (habit.habitType === 'WEEKLY' && habit.selectedDays) {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1=Mon, 7=Sun
      const selectedDaysArray = habit.selectedDays.split(',').map(d => parseInt(d));
      return selectedDaysArray.includes(adjustedDay);
    }

    return true; // Default to showing if type is unknown
  };

  // Get display text for selected days
  const getDaysDisplay = (habit) => {
    if (habit.habitType === 'WEEKLY_COUNT' && habit.weeklyTarget) {
      return `주 ${habit.weeklyTarget}회`;
    }

    if (habit.habitType !== 'WEEKLY' || !habit.selectedDays) {
      return null;
    }

    const dayNames = { 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토', 7: '일' };
    const selectedDaysArray = habit.selectedDays.split(',').map(d => parseInt(d));
    return selectedDaysArray.map(d => dayNames[d]).join('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-lg text-gray-600">로딩 중...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user.familyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">환영합니다, {user.displayName}님!</CardTitle>
            <CardDescription>
              습관 추적을 시작하려면 그룹을 만들거나 가입해야 합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/family')} className="w-full">
              <Users className="w-4 h-4 mr-2" />
              그룹 관리
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-right" />
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">습관 트래커</h1>
            <Badge variant="secondary" className="hidden sm:flex">
              {user.displayName}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/monthly')}
              variant="outline"
              size="icon"
              title="월간 통계"
            >
              <TrendingUp className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => navigate('/family')}
              variant="outline"
              size="icon"
              title="그룹 관리"
            >
              <Users className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => navigate('/settings')}
              variant="outline"
              size="icon"
              title="설정"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setShowLogoutDialog(true)}
              variant="outline"
              size="icon"
              title="로그아웃"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Family Info Card */}
        {family && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {family.name}
              </CardTitle>
              <CardDescription>
                구성원: {family.members?.length || 0}명
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-700 text-center">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Date Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeDate(-1)}
                className="h-10 w-10 shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center justify-center gap-2 flex-1 relative">
                <Calendar className="h-5 w-5 text-blue-600 pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  style={{ fontSize: '16px' }}
                />
                <h2 className="text-lg sm:text-xl font-semibold text-center pointer-events-none">
                  {formatSelectedDate()}
                </h2>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeDate(1)}
                className="h-10 w-10 shrink-0"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            {selectedDate !== getTodayLocal() && (
              <div className="mt-3 text-center">
                <Button onClick={goToToday} variant="outline" size="sm">
                  오늘로 이동
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Permission Banner */}
        {notificationPermission !== 'granted' && notificationPermission !== 'denied' && (
          <Card className="border-blue-300 bg-blue-50">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Bell className="w-5 h-5 text-blue-600" />
                <p>그룹 구성원이 습관을 체크하면 알림을 받으시겠어요?</p>
              </div>
              <Button onClick={requestNotificationPermission} size="sm">
                알림 켜기
              </Button>
            </CardContent>
          </Card>
        )}

        {/* My Habits Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>내 습관</CardTitle>
              <Button
                onClick={() => {
                  setShowAddHabit(!showAddHabit);
                  setEditingHabit(null);
                  setNewHabit({ name: '', description: '', color: getLastUsedColor(), habitType: 'DAILY', selectedDays: [] });
                }}
                size="sm"
              >
                {showAddHabit ? (
                  <>
                    <X className="w-4 h-4 mr-1" />
                    취소
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    습관 추가
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Habit Form */}
            {showAddHabit && (
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <form onSubmit={handleAddHabit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="habit-name">습관 이름</Label>
                      <Input
                        id="habit-name"
                        type="text"
                        placeholder="예: 물 마시기"
                        value={newHabit.name}
                        onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="habit-description">설명 (선택사항)</Label>
                      <Textarea
                        id="habit-description"
                        placeholder="습관에 대한 설명을 입력하세요"
                        value={newHabit.description}
                        onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="habit-color">색상</Label>
                      <Input
                        id="habit-color"
                        type="color"
                        value={newHabit.color}
                        onChange={(e) => setNewHabit({ ...newHabit, color: e.target.value })}
                        className="h-10 w-20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>습관 유형</Label>
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="DAILY"
                            checked={newHabit.habitType === 'DAILY'}
                            onChange={(e) => setNewHabit({ ...newHabit, habitType: e.target.value })}
                            className="w-4 h-4"
                          />
                          <span>매일</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="WEEKLY"
                            checked={newHabit.habitType === 'WEEKLY'}
                            onChange={(e) => setNewHabit({ ...newHabit, habitType: e.target.value })}
                            className="w-4 h-4"
                          />
                          <span>요일 지정</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="WEEKLY_COUNT"
                            checked={newHabit.habitType === 'WEEKLY_COUNT'}
                            onChange={(e) => setNewHabit({ ...newHabit, habitType: e.target.value })}
                            className="w-4 h-4"
                          />
                          <span>주 N회</span>
                        </label>
                      </div>
                    </div>

                    {newHabit.habitType === 'WEEKLY' && (
                      <div className="space-y-2">
                        <Label>요일 선택</Label>
                        <div className="grid grid-cols-7 gap-2">
                          {[
                            { num: 1, label: '월' },
                            { num: 2, label: '화' },
                            { num: 3, label: '수' },
                            { num: 4, label: '목' },
                            { num: 5, label: '금' },
                            { num: 6, label: '토' },
                            { num: 7, label: '일' }
                          ].map(day => (
                            <Button
                              key={day.num}
                              type="button"
                              onClick={() => toggleDaySelection(day.num)}
                              variant={newHabit.selectedDays?.includes(day.num) ? "default" : "outline"}
                              size="sm"
                              className="w-full"
                            >
                              {day.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {newHabit.habitType === 'WEEKLY_COUNT' && (
                      <div className="space-y-2">
                        <Label>주간 목표 횟수</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">주</span>
                          <Input
                            type="number"
                            min="1"
                            max="7"
                            value={newHabit.weeklyTarget}
                            onChange={(e) => setNewHabit({ ...newHabit, weeklyTarget: parseInt(e.target.value) || 1 })}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-600">회</span>
                        </div>
                      </div>
                    )}

                    <Button type="submit" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      생성
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Edit Habit Dialog */}
            <Dialog open={!!editingHabit} onOpenChange={(open) => !open && handleCancelEdit()}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>습관 수정</DialogTitle>
                  <DialogDescription>
                    습관의 정보를 수정하세요
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateHabit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-habit-name">습관 이름</Label>
                    <Input
                      id="edit-habit-name"
                      type="text"
                      placeholder="습관 이름"
                      value={newHabit.name}
                      onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-habit-description">설명 (선택사항)</Label>
                    <Textarea
                      id="edit-habit-description"
                      placeholder="설명"
                      value={newHabit.description}
                      onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-habit-color">색상</Label>
                    <Input
                      id="edit-habit-color"
                      type="color"
                      value={newHabit.color}
                      onChange={(e) => setNewHabit({ ...newHabit, color: e.target.value })}
                      className="h-10 w-20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>습관 유형</Label>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="DAILY"
                          checked={newHabit.habitType === 'DAILY'}
                          onChange={(e) => setNewHabit({ ...newHabit, habitType: e.target.value })}
                          className="w-4 h-4"
                        />
                        <span>매일</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="WEEKLY"
                          checked={newHabit.habitType === 'WEEKLY'}
                          onChange={(e) => setNewHabit({ ...newHabit, habitType: e.target.value })}
                          className="w-4 h-4"
                        />
                        <span>요일 지정</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="WEEKLY_COUNT"
                          checked={newHabit.habitType === 'WEEKLY_COUNT'}
                          onChange={(e) => setNewHabit({ ...newHabit, habitType: e.target.value })}
                          className="w-4 h-4"
                        />
                        <span>주 N회</span>
                      </label>
                    </div>
                  </div>

                  {newHabit.habitType === 'WEEKLY' && (
                    <div className="space-y-2">
                      <Label>요일 선택</Label>
                      <div className="grid grid-cols-7 gap-2">
                        {[
                          { num: 1, label: '월' },
                          { num: 2, label: '화' },
                          { num: 3, label: '수' },
                          { num: 4, label: '목' },
                          { num: 5, label: '금' },
                          { num: 6, label: '토' },
                          { num: 7, label: '일' }
                        ].map(day => (
                          <Button
                            key={day.num}
                            type="button"
                            onClick={() => toggleDaySelection(day.num)}
                            variant={newHabit.selectedDays?.includes(day.num) ? "default" : "outline"}
                            size="sm"
                            className="w-full"
                          >
                            {day.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {newHabit.habitType === 'WEEKLY_COUNT' && (
                    <div className="space-y-2">
                      <Label>주간 목표 횟수</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">주</span>
                        <Input
                          type="number"
                          min="1"
                          max="7"
                          value={newHabit.weeklyTarget}
                          onChange={(e) => setNewHabit({ ...newHabit, weeklyTarget: parseInt(e.target.value) || 1 })}
                          className="w-20"
                        />
                        <span className="text-sm text-gray-600">회</span>
                      </div>
                    </div>
                  )}

                  <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      취소
                    </Button>
                    <Button type="submit">
                      <Edit className="w-4 h-4 mr-2" />
                      수정
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Habits List with Drag and Drop */}
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
                <div className="space-y-3">
                  {habits
                    .filter(habit => habit.userId === user.id && isHabitForToday(habit))
                    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                    .map((habit) => {
                      const userLog = logs.find(
                        (log) => log.habit.id === habit.id && log.user.id === user.id
                      );
                      const daysDisplay = getDaysDisplay(habit);

                      // Calculate weekly progress for WEEKLY_COUNT habits
                      let weeklyProgress = null;
                      if (habit.habitType === 'WEEKLY_COUNT' && habit.weeklyTarget) {
                        const completedThisWeek = weeklyLogs.filter(
                          (log) => log.habit.id === habit.id && log.user.id === user.id && log.completed
                        ).length;
                        weeklyProgress = {
                          completed: completedThisWeek,
                          target: habit.weeklyTarget
                        };
                      }

                      return (
                        <SortableHabitItem
                          key={habit.id}
                          habit={habit}
                          userLog={userLog}
                          onToggle={handleToggleHabit}
                          onEdit={handleEditHabit}
                          onDelete={handleDeleteHabit}
                          daysDisplay={daysDisplay}
                          weeklyProgress={weeklyProgress}
                        />
                      );
                    })}
                  {habits.filter(habit => habit.userId === user.id && isHabitForToday(habit)).length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="p-8 text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500 italic">오늘 할 습관이 없습니다!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>

        {/* Family Members' Habits Section */}
        <Card>
          <CardHeader>
            <CardTitle>그룹 구성원의 습관</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {habits
                .filter(habit => habit.userId !== user.id && isHabitForToday(habit))
                .map((habit) => {
                  const habitLog = logs.find(
                    (log) => log.habit.id === habit.id
                  );
                  const isCompleted = habitLog?.completed || false;
                  const daysDisplay = getDaysDisplay(habit);

                  return (
                    <Card
                      key={habit.id}
                      className="opacity-90"
                      style={{ borderLeft: `4px solid ${habit.color}` }}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg break-words">{habit.name}</h3>
                              {daysDisplay && (
                                <Badge variant="outline" className="text-xs">
                                  {daysDisplay}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2 break-words">
                              {habit.userDisplayName}님의 습관
                            </p>
                            {habit.description && (
                              <p className="text-sm text-gray-500 break-words">{habit.description}</p>
                            )}
                            {isCompleted && habitLog?.completedAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                ✓ {new Date(habitLog.completedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                          <div
                            className="rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: isCompleted ? habit.color : '#e5e7eb',
                              color: 'white'
                            }}
                          >
                            {isCompleted ? <Check className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              {habits.filter(habit => habit.userId !== user.id && isHabitForToday(habit)).length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500 italic">오늘 다른 그룹 구성원의 습관이 없습니다.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Delete Habit Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              습관 삭제
            </DialogTitle>
            <DialogDescription className="pt-3">
              {habitToDelete && (
                <>
                  <p className="font-medium mb-2">"{habitToDelete.name}" 습관을 삭제하시겠습니까?</p>
                  <p className="text-sm text-gray-600">
                    이 작업은 되돌릴 수 없으며, 모든 기록이 함께 삭제됩니다.
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setHabitToDelete(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteHabit}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              로그아웃
            </DialogTitle>
            <DialogDescription>
              정말 로그아웃하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                logout();
                setShowLogoutDialog(false);
              }}
            >
              로그아웃
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Memo Dialog */}
      <Dialog open={showMemoDialog} onOpenChange={(open) => {
        if (!open) {
          setShowMemoDialog(false);
          setMemoHabit(null);
          setMemoText('');
          setMemoExistingLog(null);
        }
      }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Check className="h-5 w-5 text-green-600" />
              습관 체크
            </DialogTitle>
            <DialogDescription className="text-sm">
              {memoHabit && (
                <span className="font-medium text-gray-900">"{memoHabit.name}"</span>
              )}
              {" "}완료! 메모를 남겨보세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              id="memo-text"
              placeholder="오늘의 기록 (선택사항)"
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              rows={2}
              className="resize-none text-base"
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleMemoSubmit(false)}
              className="w-full sm:w-auto"
            >
              메모 없이 체크
            </Button>
            <Button
              onClick={() => handleMemoSubmit(true)}
              style={{ backgroundColor: memoHabit?.color }}
              className="w-full sm:w-auto"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Dashboard;

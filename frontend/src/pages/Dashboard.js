import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { habitAPI, habitLogAPI, familyAPI, pushAPI, commentAPI } from '../services/api';
import websocketService from '../services/websocket';
import toast, { Toaster } from 'react-hot-toast';
import CommentSection from '../components/CommentSection';
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
  DoorOpen,
  TrendingUp,
  Bell,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  AlertTriangle,
  MessageSquare,
  Home,
  Calendar as CalendarIcon,
  Heart
} from 'lucide-react';

// Figma-style Progress Circle component
function ProgressCircle({ progress, size = 36, strokeWidth = 3, color = '#3843FF' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#EAECF0"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-300"
      />
    </svg>
  );
}

// SortableHabitItem component for drag and drop - Figma Style
function SortableHabitItem({ habit, userLog, onToggle, onEdit, onDelete, daysDisplay, weeklyProgress, familyMembers, currentUserId, onCommentAdded }) {
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

  // Calculate progress percentage
  const getProgress = () => {
    if (userLog?.completed) return 100;
    if (weeklyProgress) return (weeklyProgress.completed / weeklyProgress.target) * 100;
    return 0;
  };

  // Get emoji from habit.icon field or fallback to name parsing or default
  const getEmoji = () => {
    if (habit.icon) return habit.icon;
    const emojis = habit.name.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu);
    return emojis ? emojis[0] : '✨';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <div className="bg-white dark:bg-gray-800 border border-figma-black-10 rounded-2xl p-4 hover:shadow-figma transition-all duration-200">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-figma-black-20 hover:text-figma-black-40 touch-none"
            title="드래그하여 순서 변경"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Progress Circle with Emoji */}
          <div className="relative flex-shrink-0">
            <ProgressCircle
              progress={getProgress()}
              size={40}
              strokeWidth={3}
              color={habit.color || '#3843FF'}
            />
            <span className="absolute inset-0 flex items-center justify-center text-base">
              {getEmoji()}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-figma-black-100 text-sm">{habit.name}</h3>
              {habit.currentStreak > 0 && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                  habit.currentStreak >= 30 ? 'bg-orange-100 text-orange-700' :
                  habit.currentStreak >= 7 ? 'bg-amber-100 text-amber-700' :
                  'bg-figma-blue-10 text-figma-blue-100'
                }`}>
                  🔥 {habit.currentStreak}{habit.habitType === 'WEEKLY_COUNT' ? '주' : '일'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-figma-black-40">
                {daysDisplay || (weeklyProgress ? `${weeklyProgress.completed}/${weeklyProgress.target}회` : '매일')}
              </p>
              {userLog?.completed && userLog?.completedAt && (
                <span className="text-xs text-figma-green">
                  ✓ {new Date(userLog.completedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            {userLog?.note && (
              <div className="flex items-start gap-1 mt-2 p-2 bg-figma-black-10 rounded-lg">
                <MessageSquare className="w-3 h-3 text-figma-black-40 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-figma-black-60 break-words">{userLog.note}</p>
              </div>
            )}
            {/* Comment Section for completed habits */}
            {userLog?.completed && userLog?.id && (
              <CommentSection
                habitLogId={userLog.id}
                comments={userLog.comments || []}
                familyMembers={familyMembers}
                currentUserId={currentUserId}
                onCommentAdded={onCommentAdded}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onEdit(habit)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-figma-black-10 bg-white dark:bg-gray-800 text-figma-black-40 hover:bg-figma-black-10 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(habit)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-figma-black-10 bg-white dark:bg-gray-800 text-figma-red hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggle(habit.id)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${
                userLog?.completed
                  ? 'bg-figma-green border-figma-green text-white'
                  : 'border-figma-black-10 bg-white dark:bg-gray-800 text-figma-black-40 hover:border-figma-blue-100'
              }`}
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
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
    weeklyTarget: 3,
    emoji: '✨'
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
        newHabit.emoji,
        newHabit.habitType,
        selectedDaysStr,
        weeklyTarget
      );

      // Save the last used color to localStorage
      localStorage.setItem('lastHabitColor', newHabit.color);

      setNewHabit({ name: '', description: '', color: newHabit.color, habitType: 'DAILY', selectedDays: [], weeklyTarget: 3, emoji: '✨' });
      setShowAddHabit(false);
      setShowEmojiPicker(false);
      loadData();
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  };

  const handleEditHabit = (habit) => {
    setEditingHabit(habit);
    // Use habit.icon if available, otherwise extract from name or use default
    let emoji = habit.icon || '✨';
    if (!habit.icon) {
      const emojiMatch = habit.name.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu);
      emoji = emojiMatch ? emojiMatch[0] : '✨';
    }
    setNewHabit({
      name: habit.name,
      description: habit.description || '',
      color: habit.color,
      habitType: habit.habitType || 'DAILY',
      selectedDays: habit.selectedDays ? habit.selectedDays.split(',').map(d => parseInt(d)) : [],
      weeklyTarget: habit.weeklyTarget || 3,
      emoji: emoji
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
        newHabit.emoji,
        newHabit.habitType,
        selectedDaysStr,
        weeklyTarget
      );

      // Save the last used color to localStorage
      localStorage.setItem('lastHabitColor', newHabit.color);

      setNewHabit({ name: '', description: '', color: getLastUsedColor(), habitType: 'DAILY', selectedDays: [], weeklyTarget: 3, emoji: '✨' });
      setEditingHabit(null);
      setShowEmojiPicker(false);
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
    setNewHabit({ name: '', description: '', color: getLastUsedColor(), habitType: 'DAILY', selectedDays: [], weeklyTarget: 3, emoji: '✨' });
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

  // Get week dates for horizontal calendar
  const getWeekDates = () => {
    const dates = [];
    const [year, month, day] = selectedDate.split('-').map(Number);
    const selected = new Date(year, month - 1, day);
    const dayOfWeek = selected.getDay();
    const startOfWeek = new Date(selected);
    startOfWeek.setDate(selected.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Start from Monday

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Navigate to previous/next week
  const changeWeek = (delta) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const current = new Date(year, month - 1, day);
    current.setDate(current.getDate() + (delta * 7));
    const newDateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    setSelectedDate(newDateStr);
  };

  // Get week range display text
  const getWeekRangeText = () => {
    const dates = getWeekDates();
    const start = dates[0];
    const end = dates[6];
    const startMonth = start.getMonth() + 1;
    const endMonth = end.getMonth() + 1;

    if (startMonth === endMonth) {
      return `${startMonth}월 ${start.getDate()}일 - ${end.getDate()}일`;
    }
    return `${startMonth}/${start.getDate()} - ${endMonth}/${end.getDate()}`;
  };

  // Check if selected date is in current week
  const isCurrentWeek = () => {
    const today = new Date();
    const todayStr = getTodayLocal();
    const dates = getWeekDates();
    return dates.some(d => {
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return dStr === todayStr;
    });
  };

  const dayNames = ['월', '화', '수', '목', '금', '토', '일'];

  if (loading) {
    return (
      <div className="min-h-screen bg-figma-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-figma-blue-100 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-figma-black-40">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user.familyId) {
    return (
      <div className="min-h-screen bg-figma-bg flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-figma">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-figma-blue-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-figma-blue-100" />
            </div>
            <h2 className="text-xl font-semibold text-figma-black-100">환영합니다, {user.displayName}님!</h2>
            <p className="text-figma-black-40 mt-2">습관 추적을 시작하려면 그룹을 만들거나 가입해야 합니다.</p>
          </div>
          <Button onClick={() => navigate('/family')} className="w-full bg-figma-blue-100 hover:bg-figma-blue-100/90 rounded-2xl h-12">
            <Users className="w-4 h-4 mr-2" />
            그룹 관리
          </Button>
        </div>
      </div>
    );
  }

  // Calculate completion stats
  const myHabitsToday = habits.filter(h => h.userId === user.id && isHabitForToday(h));
  const completedToday = myHabitsToday.filter(h =>
    logs.find(l => l.habit.id === h.id && l.user.id === user.id && l.completed)
  ).length;
  const completionRate = myHabitsToday.length > 0 ? Math.round((completedToday / myHabitsToday.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-figma-bg pb-24">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-figma-black-10 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-6 py-4">
          {/* User Greeting */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-figma-black-100">
                안녕하세요, {user.displayName}님
              </h1>
              <p className="text-sm text-figma-black-40">
                {family ? `${family.name}` : '오늘도 습관을 만들어요!'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/monthly')}
                className="w-10 h-10 bg-figma-black-10 rounded-full flex items-center justify-center hover:bg-figma-black-20 transition-colors"
                title="월간 통계"
              >
                <TrendingUp className="w-5 h-5 text-figma-black-60" />
              </button>
              <button
                onClick={() => setShowLogoutDialog(true)}
                className="w-10 h-10 bg-figma-black-10 rounded-full flex items-center justify-center hover:bg-figma-black-20 transition-colors"
                title="로그아웃"
              >
                <DoorOpen className="w-5 h-5 text-figma-black-60" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-6 py-4 space-y-4 pb-24">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-700 text-center text-sm">{error}</p>
          </div>
        )}

        {/* Figma-style Horizontal Date Picker with Week Navigation */}
        <div className="bg-white dark:bg-gray-800 border border-figma-black-10 rounded-2xl p-3">
          {/* Week Navigation Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => changeWeek(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-figma-black-10 bg-white dark:bg-gray-800 hover:bg-figma-black-10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-figma-black-60" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-figma-black-100">
                {getWeekRangeText()}
              </span>
              {!isCurrentWeek() && (
                <button
                  onClick={goToToday}
                  className="px-2 py-1 text-xs font-medium text-figma-blue-100 bg-figma-blue-10 rounded-lg hover:bg-figma-blue-20 transition-colors"
                >
                  오늘
                </button>
              )}
            </div>
            <button
              onClick={() => changeWeek(1)}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-figma-black-10 bg-white dark:bg-gray-800 hover:bg-figma-black-10 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-figma-black-60" />
            </button>
          </div>

          {/* Week Days */}
          <div className="flex gap-2">
            {getWeekDates().map((date, index) => {
              const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === getTodayLocal();

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex-1 py-3 rounded-2xl flex flex-col items-center transition-all ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#6B73FF] to-[#3843FF] text-white'
                      : isToday
                        ? 'bg-figma-blue-10 border border-figma-blue-40 text-figma-black-100'
                        : 'bg-figma-black-10 text-figma-black-100 hover:bg-figma-black-20'
                  }`}
                >
                  <span className={`text-lg font-medium ${isSelected ? 'text-white' : 'text-figma-black-100'}`}>
                    {date.getDate()}
                  </span>
                  <span className={`text-[10px] font-bold tracking-wide uppercase ${
                    isSelected ? 'text-white/80' : 'text-figma-black-40'
                  }`}>
                    {dayNames[index]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Info Box - Figma Style */}
        <div className="bg-gradient-to-r from-[#6B73FF] to-[#3843FF] rounded-2xl p-4 flex items-center gap-3">
          <div className="relative">
            <ProgressCircle
              progress={completionRate}
              size={44}
              strokeWidth={3}
              color="#FFFFFF"
            />
            <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
              {completionRate}%
            </span>
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">
              {completedToday === myHabitsToday.length && myHabitsToday.length > 0
                ? '오늘 목표 달성! 🎉'
                : '오늘의 목표를 달성해보세요! 🔥'}
            </p>
            <p className="text-figma-blue-40 text-xs">
              {completedToday}/{myHabitsToday.length} 완료
            </p>
          </div>
        </div>

        {/* Notification Permission Banner */}
        {notificationPermission !== 'granted' && notificationPermission !== 'denied' && (
          <div className="bg-figma-info rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-figma-blue-100" />
              <p className="text-sm text-figma-black-100">알림을 켜서 습관 완료 소식을 받아보세요</p>
            </div>
            <button
              onClick={requestNotificationPermission}
              className="px-3 py-1.5 bg-figma-blue-100 text-white text-xs font-medium rounded-xl hover:bg-figma-blue-100/90 transition-colors"
            >
              켜기
            </button>
          </div>
        )}

        {/* My Habits Section - Figma Style */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-medium text-figma-black-100">내 습관</h2>
            <button
              onClick={() => {
                setShowAddHabit(!showAddHabit);
                setEditingHabit(null);
                setNewHabit({ name: '', description: '', color: getLastUsedColor(), habitType: 'DAILY', selectedDays: [], weeklyTarget: 3, emoji: '✨' });
              }}
              className="text-[10px] font-bold tracking-wide uppercase text-figma-blue-100 hover:text-figma-blue-100/80"
            >
              {showAddHabit ? '취소' : '추가'}
            </button>
          </div>
          <div className="space-y-3">
            {/* Add Habit Form - Figma Style */}
            {showAddHabit && (
              <div className="bg-white dark:bg-gray-800 border border-figma-black-10 rounded-2xl p-4">
                <form onSubmit={handleAddHabit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="habit-name" className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">습관 이름</Label>
                    <Input
                      id="habit-name"
                      type="text"
                      placeholder="예: 💧 물 마시기"
                      value={newHabit.name}
                      onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                      required
                      className="rounded-xl border-figma-black-10 focus:border-figma-blue-100 focus:ring-figma-blue-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="habit-description" className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">설명 (선택)</Label>
                    <Textarea
                      id="habit-description"
                      placeholder="습관에 대한 설명"
                      value={newHabit.description}
                      onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                      rows={2}
                      className="rounded-xl border-figma-black-10 focus:border-figma-blue-100 focus:ring-figma-blue-100"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">아이콘</Label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="w-14 h-14 rounded-xl border border-figma-black-10 flex items-center justify-center text-2xl bg-white dark:bg-gray-800 hover:bg-figma-black-10 transition-colors cursor-pointer"
                        >
                          {newHabit.emoji}
                        </button>
                        {showEmojiPicker && (
                          <div className="absolute top-16 left-0 z-50 bg-white dark:bg-gray-800 border border-figma-black-10 rounded-xl p-3 shadow-lg w-64">
                            <div className="grid grid-cols-7 gap-1">
                              {['✨', '💧', '🏃', '📚', '💪', '🧘', '😴',
                                '🍎', '💊', '🎯', '✍️', '🎨', '🎵', '🧹',
                                '🌅', '🌙', '☀️', '🔥', '💡', '🎮', '📱',
                                '💰', '🛒', '🚗', '✈️', '🏠', '👨‍👩‍👧', '❤️',
                                '🙏', '😊', '🎉', '⭐', '🌟', '💎', '🏆'].map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => {
                                    setNewHabit({ ...newHabit, emoji });
                                    setShowEmojiPicker(false);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center text-xl hover:bg-figma-black-10 rounded-lg transition-colors"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="habit-color" className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">색상</Label>
                      <div className="relative">
                        <Input
                          id="habit-color"
                          type="color"
                          value={newHabit.color}
                          onChange={(e) => setNewHabit({ ...newHabit, color: e.target.value })}
                          className="w-14 h-14 rounded-xl p-1 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">습관 유형</Label>
                    <div className="bg-figma-black-10 p-0.5 rounded-2xl flex">
                      {[
                        { value: 'DAILY', label: '매일' },
                        { value: 'WEEKLY', label: '요일 지정' },
                        { value: 'WEEKLY_COUNT', label: '주 N회' }
                      ].map(type => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setNewHabit({ ...newHabit, habitType: type.value })}
                          className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                            newHabit.habitType === type.value
                              ? 'bg-white dark:bg-gray-800 text-figma-black-100 shadow-figma'
                              : 'text-figma-black-60 hover:text-figma-black-100'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {newHabit.habitType === 'WEEKLY' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">요일 선택</Label>
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
                          <button
                            key={day.num}
                            type="button"
                            onClick={() => toggleDaySelection(day.num)}
                            className={`w-full py-2 rounded-xl text-sm font-medium transition-all ${
                              newHabit.selectedDays?.includes(day.num)
                                ? 'bg-figma-blue-100 text-white'
                                : 'bg-white dark:bg-gray-800 border border-figma-black-10 text-figma-black-60 hover:border-figma-blue-40'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {newHabit.habitType === 'WEEKLY_COUNT' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-figma-black-40 uppercase tracking-wide">주간 목표</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-figma-black-60">주</span>
                        <Input
                          type="number"
                          min="1"
                          max="7"
                          value={newHabit.weeklyTarget || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewHabit({ ...newHabit, weeklyTarget: val === '' ? '' : Math.min(7, Math.max(1, parseInt(val) || 1)) });
                          }}
                          onBlur={(e) => {
                            if (!newHabit.weeklyTarget) {
                              setNewHabit({ ...newHabit, weeklyTarget: 3 });
                            }
                          }}
                          className="w-20 rounded-xl border-figma-black-10"
                        />
                        <span className="text-sm text-figma-black-60">회</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-figma-blue-100 text-white font-medium rounded-2xl hover:bg-figma-blue-100/90 transition-colors"
                  >
                    습관 만들기
                  </button>
                </form>
              </div>
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
                  <div className="flex gap-4">
                    <div className="space-y-2">
                      <Label>아이콘</Label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="w-12 h-12 rounded-xl border border-figma-black-10 flex items-center justify-center text-xl bg-white dark:bg-gray-800 hover:bg-figma-black-10 transition-colors cursor-pointer"
                        >
                          {newHabit.emoji}
                        </button>
                        {showEmojiPicker && (
                          <div className="absolute top-14 left-0 z-50 bg-white dark:bg-gray-800 border border-figma-black-10 rounded-xl p-3 shadow-lg w-64">
                            <div className="grid grid-cols-7 gap-1">
                              {['✨', '💧', '🏃', '📚', '💪', '🧘', '😴',
                                '🍎', '💊', '🎯', '✍️', '🎨', '🎵', '🧹',
                                '🌅', '🌙', '☀️', '🔥', '💡', '🎮', '📱',
                                '💰', '🛒', '🚗', '✈️', '🏠', '👨‍👩‍👧', '❤️',
                                '🙏', '😊', '🎉', '⭐', '🌟', '💎', '🏆'].map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => {
                                    setNewHabit({ ...newHabit, emoji });
                                    setShowEmojiPicker(false);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center text-xl hover:bg-figma-black-10 rounded-lg transition-colors"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-habit-color">색상</Label>
                      <Input
                        id="edit-habit-color"
                        type="color"
                        value={newHabit.color}
                        onChange={(e) => setNewHabit({ ...newHabit, color: e.target.value })}
                        className="h-12 w-12 rounded-xl p-1 cursor-pointer"
                      />
                    </div>
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
                          value={newHabit.weeklyTarget || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewHabit({ ...newHabit, weeklyTarget: val === '' ? '' : Math.min(7, Math.max(1, parseInt(val) || 1)) });
                          }}
                          onBlur={(e) => {
                            if (!newHabit.weeklyTarget) {
                              setNewHabit({ ...newHabit, weeklyTarget: 3 });
                            }
                          }}
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
                          familyMembers={family?.members || []}
                          currentUserId={user.id}
                          onCommentAdded={loadData}
                        />
                      );
                    })}
                  {habits.filter(habit => habit.userId === user.id && isHabitForToday(habit)).length === 0 && (
                    <div className="bg-white dark:bg-gray-800 border border-dashed border-figma-black-20 rounded-2xl p-8 text-center">
                      <div className="w-12 h-12 bg-figma-blue-10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-6 h-6 text-figma-blue-100" />
                      </div>
                      <p className="text-figma-black-40 text-sm">오늘 할 습관이 없습니다</p>
                      <button
                        onClick={() => setShowAddHabit(true)}
                        className="mt-3 text-figma-blue-100 text-sm font-medium hover:underline"
                      >
                        + 새 습관 만들기
                      </button>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Family Members' Habits Section - Figma Style */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-medium text-figma-black-100">그룹 습관</h2>
            <button
              onClick={() => navigate('/family')}
              className="text-[10px] font-bold tracking-wide uppercase text-figma-blue-100 hover:text-figma-blue-100/80"
            >
              모두 보기
            </button>
          </div>
          <div className="space-y-3">
            {habits
              .filter(habit => habit.userId !== user.id && isHabitForToday(habit))
              .map((habit) => {
                const habitLog = logs.find(
                  (log) => log.habit.id === habit.id
                );
                const isCompleted = habitLog?.completed || false;
                const daysDisplay = getDaysDisplay(habit);

                // Get emoji from habit.icon field or fallback to name parsing or default
                const emoji = habit.icon || habit.name.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu)?.[0] || '✨';

                return (
                  <div
                    key={habit.id}
                    className="bg-white dark:bg-gray-800 border border-figma-black-10 rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      {/* Progress Circle with Emoji */}
                      <div className="relative flex-shrink-0">
                        <ProgressCircle
                          progress={isCompleted ? 100 : 0}
                          size={40}
                          strokeWidth={3}
                          color={habit.color || '#3843FF'}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-base">
                          {emoji}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-figma-black-100 text-sm">{habit.name}</h3>
                          {habit.currentStreak > 0 && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                              habit.currentStreak >= 30 ? 'bg-orange-100 text-orange-700' :
                              habit.currentStreak >= 7 ? 'bg-amber-100 text-amber-700' :
                              'bg-figma-blue-10 text-figma-blue-100'
                            }`}>
                              🔥 {habit.currentStreak}{habit.habitType === 'WEEKLY_COUNT' ? '주' : '일'}
                            </span>
                          )}
                          {daysDisplay && (
                            <span className="text-[10px] bg-figma-black-10 text-figma-black-60 px-2 py-0.5 rounded-full">
                              {daysDisplay}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-figma-black-40">
                          {habit.userDisplayName}
                          {isCompleted && habitLog?.completedAt && (
                            <span className="text-figma-green ml-2">
                              ✓ {new Date(habitLog.completedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </p>
                        {habitLog?.note && (
                          <div className="flex items-start gap-1 mt-2 p-2 bg-figma-black-10 rounded-lg">
                            <MessageSquare className="w-3 h-3 text-figma-black-40 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-figma-black-60 break-words">{habitLog.note}</p>
                          </div>
                        )}
                        {/* Comment Section for completed habits */}
                        {isCompleted && habitLog?.id && (
                          <CommentSection
                            habitLogId={habitLog.id}
                            comments={habitLog.comments || []}
                            familyMembers={family?.members || []}
                            currentUserId={user.id}
                            onCommentAdded={loadData}
                          />
                        )}
                      </div>

                      {/* Status Indicator */}
                      <div
                        className={`w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 ${
                          isCompleted
                            ? 'bg-figma-green text-white'
                            : 'bg-figma-black-10 text-figma-black-40'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            {habits.filter(habit => habit.userId !== user.id && isHabitForToday(habit)).length === 0 && (
              <div className="bg-white dark:bg-gray-800 border border-dashed border-figma-black-20 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 bg-figma-blue-10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-figma-blue-100" />
                </div>
                <p className="text-figma-black-40 text-sm">그룹 구성원의 습관이 없습니다</p>
                <button
                  onClick={() => navigate('/family')}
                  className="mt-3 text-figma-blue-100 text-sm font-medium hover:underline"
                >
                  그룹 초대하기
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-figma-black-10 z-40">
        <div className="flex justify-around items-center py-2">
          <button className="flex flex-col items-center p-2 text-figma-blue-100">
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">홈</span>
          </button>
          <button onClick={() => navigate('/calendar')} className="flex flex-col items-center p-2 text-figma-black-40">
            <CalendarIcon className="w-6 h-6" />
            <span className="text-xs mt-1">캘린더</span>
          </button>
          <button onClick={() => navigate('/health')} className="flex flex-col items-center p-2 text-figma-black-40">
            <Heart className="w-6 h-6" />
            <span className="text-xs mt-1">건강</span>
          </button>
          <button onClick={() => navigate('/family')} className="flex flex-col items-center p-2 text-figma-black-40">
            <Users className="w-6 h-6" />
            <span className="text-xs mt-1">가족</span>
          </button>
          <button onClick={() => navigate('/settings')} className="flex flex-col items-center p-2 text-figma-black-40">
            <Settings className="w-6 h-6" />
            <span className="text-xs mt-1">설정</span>
          </button>
        </div>
      </nav>

      {/* Floating Add Button */}
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={() => {
            setShowAddHabit(!showAddHabit);
            setEditingHabit(null);
            setNewHabit({ name: '', description: '', color: getLastUsedColor(), habitType: 'DAILY', selectedDays: [], weeklyTarget: 3, emoji: '✨' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-14 h-14 bg-gradient-to-r from-[#6B73FF] to-[#3843FF] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>

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
          <DialogFooter>
            <Button
              onClick={() => handleMemoSubmit(true)}
              style={{ backgroundColor: memoHabit?.color }}
              className="w-full sm:w-auto"
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Dashboard;

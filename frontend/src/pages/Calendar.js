import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { calendarAPI, familyAPI } from '../services/api';
import Holidays from 'date-holidays';
import websocketService from '../services/websocket';
import toast, { Toaster } from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Repeat,
  Bell,
  Trash2,
  Edit,
  X,
  Check,
  Home,
  Users,
  TrendingUp,
  Settings,
  Heart
} from 'lucide-react';

const COLORS = [
  '#3843FF', '#E3524F', '#3BA935', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

// Get last used color from localStorage, default to blue if not found
const getLastUsedEventColor = () => {
  return localStorage.getItem('lastEventColor') || '#3843FF';
};

const REPEAT_OPTIONS = [
  { value: 'NONE', label: '반복 안함' },
  { value: 'DAILY', label: '매일' },
  { value: 'WEEKLY', label: '매주' },
  { value: 'MONTHLY', label: '매월' },
  { value: 'YEARLY', label: '매년' }
];

const REMINDER_OPTIONS = [
  { value: null, label: '알림 없음' },
  { value: 0, label: '일정 시작 시' },
  { value: 10, label: '10분 전' },
  { value: 30, label: '30분 전' },
  { value: 60, label: '1시간 전' },
  { value: 120, label: '2시간 전' },
  { value: 1440, label: '1일 전' }
];

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

// 한국 공휴일 라이브러리 초기화
const hd = new Holidays('KR');

// 공휴일 이름 한글화 매핑
const HOLIDAY_NAME_MAP = {
  'New Year\'s Day': '신정',
  'Seollal': '설날',
  'Korean New Year': '설날',
  'Independence Movement Day': '삼일절',
  'Children\'s Day': '어린이날',
  'Buddha\'s Birthday': '부처님오신날',
  'Memorial Day': '현충일',
  'Liberation Day': '광복절',
  'Chuseok': '추석',
  'National Foundation Day': '개천절',
  'Hangul Day': '한글날',
  'Christmas Day': '크리스마스',
  '기독탄신일': '크리스마스',
  'Substitute Holiday': '대체공휴일',
};

function Calendar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Form states
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    allDay: false,
    color: getLastUsedEventColor(),
    repeatType: 'NONE',
    repeatEndDate: '',
    reminderMinutes: null
  });
  const [isEditing, setIsEditing] = useState(false);

  // Swipe handling
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const isDragging = useRef(false);

  // Format date to YYYY-MM-DD in local timezone
  const formatDateLocal = useCallback((date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Get calendar data
  const getMonthRange = useCallback((date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Extend to include visible days from prev/next months
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    return {
      start: formatDateLocal(startDate),
      end: formatDateLocal(endDate)
    };
  }, [formatDateLocal]);

  const loadEvents = useCallback(async () => {
    try {
      const range = getMonthRange(currentDate);
      const response = await calendarAPI.getEvents(range.start, range.end);
      setEvents(response.data);
    } catch (error) {
      console.error('Error loading events:', error);
      if (error.response?.status !== 500) {
        toast.error('일정을 불러오는데 실패했습니다');
      }
    }
  }, [currentDate, getMonthRange]);

  const loadFamily = useCallback(async () => {
    try {
      const response = await familyAPI.getMy();
      setFamily(response.data);
    } catch (error) {
      console.error('Error loading family:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadFamily(), loadEvents()]);
      setLoading(false);
    };
    loadData();
  }, [loadFamily, loadEvents]);

  // WebSocket subscription
  useEffect(() => {
    if (!family?.id) return;

    const connectAndSubscribe = async () => {
      try {
        await websocketService.connect();
        websocketService.subscribe(
          `/topic/family/${family.id}/calendar-updates`,
          (message) => {
            const update = JSON.parse(message.body);
            if (update.type === 'CREATED' || update.type === 'UPDATED') {
              loadEvents();
            } else if (update.type === 'DELETED') {
              setEvents(prev => prev.filter(e => e.id !== update.deletedEventId));
            }
          }
        );
      } catch (error) {
        console.error('WebSocket connection error:', error);
      }
    };

    connectAndSubscribe();

    return () => {
      websocketService.unsubscribe(`/topic/family/${family.id}/calendar-updates`);
    };
  }, [family?.id, loadEvents]);

  // Calendar navigation
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Touch/Swipe handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    setSwipeOffset(diff * 0.3); // 저항감 있게
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const diff = touchCurrentX.current - touchStartX.current;
    const threshold = 50; // 최소 스와이프 거리

    if (Math.abs(diff) > threshold) {
      setIsAnimating(true);
      const direction = diff > 0 ? -1 : 1; // 오른쪽 스와이프 = 이전 달
      setSwipeOffset(direction > 0 ? -100 : 100);

      setTimeout(() => {
        if (direction > 0) {
          goToNextMonth();
        } else {
          goToPrevMonth();
        }
        setSwipeOffset(0);
        setIsAnimating(false);
      }, 200);
    } else {
      setSwipeOffset(0);
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Get holiday info for a specific date using date-holidays library
  const getHolidayInfo = useCallback((date) => {
    const holidays = hd.isHoliday(date);
    if (holidays && holidays.length > 0) {
      const holiday = holidays[0];
      // public = 공휴일, observance = 기념일
      const displayName = HOLIDAY_NAME_MAP[holiday.name] || holiday.name;
      return {
        name: displayName,
        isHoliday: holiday.type === 'public'
      };
    }
    return null;
  }, []);

  // Get events for a specific day
  const getEventsForDay = (date) => {
    const dateStr = formatDateLocal(date);
    return events.filter(event => {
      const eventStart = event.startDatetime.split('T')[0];
      const eventEnd = event.endDatetime.split('T')[0];
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  // Handle day click
  const handleDayClick = (date) => {
    const dateStr = formatDateLocal(date);
    setSelectedDate(dateStr);
    setEventForm({
      title: '',
      description: '',
      startDate: dateStr,
      startTime: '09:00',
      endDate: dateStr,
      endTime: '10:00',
      allDay: false,
      color: getLastUsedEventColor(),
      repeatType: 'NONE',
      repeatEndDate: '',
      reminderMinutes: null
    });
    setIsEditing(false);
    setShowEventDialog(true);
  };

  // Handle event click
  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  // Handle edit event
  const handleEditEvent = () => {
    if (!selectedEvent) return;

    const startDate = selectedEvent.startDatetime.split('T')[0];
    const startTime = selectedEvent.startDatetime.split('T')[1]?.substring(0, 5) || '09:00';
    const endDate = selectedEvent.endDatetime.split('T')[0];
    const endTime = selectedEvent.endDatetime.split('T')[1]?.substring(0, 5) || '10:00';

    setEventForm({
      title: selectedEvent.title,
      description: selectedEvent.description || '',
      startDate,
      startTime,
      endDate,
      endTime,
      allDay: selectedEvent.allDay,
      color: selectedEvent.color,
      repeatType: selectedEvent.repeatType,
      repeatEndDate: selectedEvent.repeatEndDate || '',
      reminderMinutes: selectedEvent.reminderMinutes
    });
    setIsEditing(true);
    setShowEventDetail(false);
    setShowEventDialog(true);
  };

  // Handle save event
  const handleSaveEvent = async () => {
    if (!eventForm.title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }

    try {
      const startDatetime = eventForm.allDay
        ? `${eventForm.startDate}T00:00:00`
        : `${eventForm.startDate}T${eventForm.startTime}:00`;

      const endDatetime = eventForm.allDay
        ? `${eventForm.endDate}T23:59:59`
        : `${eventForm.endDate}T${eventForm.endTime}:00`;

      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        startDatetime,
        endDatetime,
        allDay: eventForm.allDay,
        color: eventForm.color,
        repeatType: eventForm.repeatType,
        repeatEndDate: eventForm.repeatEndDate || null,
        reminderMinutes: eventForm.reminderMinutes
      };

      if (isEditing && selectedEvent) {
        await calendarAPI.updateEvent(selectedEvent.id, eventData);
        toast.success('일정이 수정되었습니다');
      } else {
        await calendarAPI.createEvent(eventData);
        toast.success('일정이 추가되었습니다');
      }

      // Save the last used color to localStorage
      localStorage.setItem('lastEventColor', eventForm.color);

      setShowEventDialog(false);
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('일정 저장에 실패했습니다');
    }
  };

  // Handle delete event
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return;

    try {
      await calendarAPI.deleteEvent(selectedEvent.id);
      toast.success('일정이 삭제되었습니다');
      setShowEventDetail(false);
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('일정 삭제에 실패했습니다');
    }
  };

  const formatTime = (datetime) => {
    if (!datetime) return '';
    const time = datetime.split('T')[1];
    if (!time) return '';
    return time.substring(0, 5);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <h1 className="text-base md:text-xl font-bold text-foreground">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </h1>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={goToPrevMonth}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  오늘
                </Button>
                <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <Button
              onClick={() => handleDayClick(new Date())}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-1" />
              일정 추가
            </Button>
          </div>
        </div>
      </header>

      {/* Calendar Grid */}
      <main className="max-w-7xl mx-auto px-0 md:px-4 py-2 md:py-4 overflow-hidden">
        <Card
          className="overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: isAnimating ? 'transform 0.2s ease-out' : 'none'
          }}
        >
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {DAY_NAMES.map((day, index) => (
              <div
                key={day}
                className={`py-2 text-center text-sm font-medium ${
                  index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-muted-foreground'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {generateCalendarDays().map((date, index) => {
              const dayEvents = getEventsForDay(date);
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDay = isToday(date);
              const holidayInfo = getHolidayInfo(date);

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(date)}
                  className={`min-h-[100px] md:min-h-[120px] border-b border-r border-border p-0.5 md:p-1 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !isCurrentMonthDay ? 'bg-muted/30' : ''
                  }`}
                >
                  <div className="flex justify-center">
                    <span
                      className={`text-xs md:text-sm w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full ${
                        isTodayDay
                          ? 'bg-primary text-primary-foreground font-bold'
                          : !isCurrentMonthDay
                          ? 'text-muted-foreground'
                          : holidayInfo?.isHoliday || date.getDay() === 0
                          ? 'text-red-500'
                          : date.getDay() === 6
                          ? 'text-blue-500'
                          : 'text-foreground'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Holiday/Anniversary */}
                  {holidayInfo && (
                    <div className={`text-[8px] md:text-xs leading-tight whitespace-nowrap overflow-hidden ${
                      holidayInfo.isHoliday ? 'text-red-500' : 'text-muted-foreground'
                    }`}>
                      {holidayInfo.name}
                    </div>
                  )}

                  {/* Events */}
                  <div className="space-y-px">
                    {dayEvents.slice(0, holidayInfo ? 2 : 3).map((event, eventIndex) => (
                      <div
                        key={`${event.id}-${eventIndex}`}
                        onClick={(e) => handleEventClick(event, e)}
                        className="text-[8px] md:text-xs leading-tight py-px cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap overflow-hidden"
                        style={{
                          backgroundColor: event.color + '20',
                          color: event.color
                        }}
                      >
                        <span className="font-medium">
                          {event.title}
                        </span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[8px] md:text-xs text-muted-foreground">
                        +{dayEvents.length - 3}개
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center py-2">
          <button onClick={() => navigate('/')} className="flex flex-col items-center p-2 text-muted-foreground">
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">홈</span>
          </button>
          <button className="flex flex-col items-center p-2 text-primary">
            <CalendarIcon className="w-6 h-6" />
            <span className="text-xs mt-1">캘린더</span>
          </button>
          <button onClick={() => navigate('/health')} className="flex flex-col items-center p-2 text-muted-foreground">
            <Heart className="w-6 h-6" />
            <span className="text-xs mt-1">건강</span>
          </button>
          <button onClick={() => navigate('/family')} className="flex flex-col items-center p-2 text-muted-foreground">
            <Users className="w-6 h-6" />
            <span className="text-xs mt-1">가족</span>
          </button>
          <button onClick={() => navigate('/settings')} className="flex flex-col items-center p-2 text-muted-foreground">
            <Settings className="w-6 h-6" />
            <span className="text-xs mt-1">설정</span>
          </button>
        </div>
      </nav>

      {/* Event Detail Dialog */}
      <Dialog open={showEventDetail} onOpenChange={setShowEventDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedEvent?.color }}
              />
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {/* Time */}
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  {selectedEvent.allDay ? (
                    <span>종일</span>
                  ) : (
                    <span>
                      {selectedEvent.startDatetime.split('T')[0]} {formatTime(selectedEvent.startDatetime)}
                      {' - '}
                      {selectedEvent.endDatetime.split('T')[0]} {formatTime(selectedEvent.endDatetime)}
                    </span>
                  )}
                </div>
              </div>

              {/* Repeat */}
              {selectedEvent.repeatType !== 'NONE' && (
                <div className="flex items-center gap-3 text-sm">
                  <Repeat className="w-5 h-5 text-muted-foreground" />
                  <span>
                    {REPEAT_OPTIONS.find(r => r.value === selectedEvent.repeatType)?.label}
                    {selectedEvent.repeatEndDate && ` (${selectedEvent.repeatEndDate}까지)`}
                  </span>
                </div>
              )}

              {/* Reminder */}
              {selectedEvent.reminderMinutes !== null && (
                <div className="flex items-center gap-3 text-sm">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <span>
                    {REMINDER_OPTIONS.find(r => r.value === selectedEvent.reminderMinutes)?.label}
                  </span>
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div className="text-sm text-muted-foreground border-t border-border pt-4">
                  {selectedEvent.description}
                </div>
              )}

              {/* Created by */}
              <div className="text-xs text-muted-foreground border-t border-border pt-4">
                {selectedEvent.createdByDisplayName || selectedEvent.createdByName}님이 생성
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleDeleteEvent} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-1" />
              삭제
            </Button>
            <Button onClick={handleEditEvent}>
              <Edit className="w-4 h-4 mr-1" />
              수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Form Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? '일정 수정' : '새 일정'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="일정 제목"
              />
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                checked={eventForm.allDay}
                onChange={(e) => setEventForm({ ...eventForm, allDay: e.target.checked })}
                className="w-4 h-4 rounded border-border"
              />
              <Label htmlFor="allDay" className="cursor-pointer">종일</Label>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>시작</Label>
                <Input
                  type="date"
                  value={eventForm.startDate}
                  onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                />
                {!eventForm.allDay && (
                  <Input
                    type="time"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                    className="mt-2"
                  />
                )}
              </div>
              <div>
                <Label>종료</Label>
                <Input
                  type="date"
                  value={eventForm.endDate}
                  onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                />
                {!eventForm.allDay && (
                  <Input
                    type="time"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            {/* Color */}
            <div>
              <Label>색상</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEventForm({ ...eventForm, color })}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      eventForm.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Repeat */}
            <div>
              <Label>반복</Label>
              <select
                value={eventForm.repeatType}
                onChange={(e) => setEventForm({ ...eventForm, repeatType: e.target.value })}
                className="w-full mt-2 p-2 border border-border rounded-md bg-background text-foreground"
              >
                {REPEAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {eventForm.repeatType !== 'NONE' && (
                <div className="mt-2">
                  <Label className="text-sm text-muted-foreground">반복 종료일 (선택)</Label>
                  <Input
                    type="date"
                    value={eventForm.repeatEndDate}
                    onChange={(e) => setEventForm({ ...eventForm, repeatEndDate: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Reminder */}
            <div>
              <Label>알림</Label>
              <select
                value={eventForm.reminderMinutes ?? ''}
                onChange={(e) => setEventForm({
                  ...eventForm,
                  reminderMinutes: e.target.value === '' ? null : parseInt(e.target.value)
                })}
                className="w-full mt-2 p-2 border border-border rounded-md bg-background text-foreground"
              >
                {REMINDER_OPTIONS.map((option) => (
                  <option key={option.value ?? 'null'} value={option.value ?? ''}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <Label>메모</Label>
              <Textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="메모 (선택)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSaveEvent} style={{ backgroundColor: eventForm.color }}>
              {isEditing ? '수정' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom padding for navigation */}
      <div className="h-20" />
    </div>
  );
}

export default Calendar;

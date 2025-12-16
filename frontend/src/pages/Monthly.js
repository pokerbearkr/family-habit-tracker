import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { habitLogAPI } from '../services/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  Home,
  Users,
  DoorOpen,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  Award,
  Settings,
  Check,
  X,
  AlertTriangle,
  MessageSquare,
  Calendar as CalendarIcon,
  Heart
} from 'lucide-react';

function Monthly() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [showDayDialog, setShowDayDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null); // 선택된 습관 (월간 캘린더용)

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

  const handleDayClick = (dateKey, dayStat) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    setSelectedDayData({
      dateObj: dateObj,
      dateKey: dateKey,
      ...dayStat
    });
    setShowDayDialog(true);
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  // 습관 클릭 핸들러 - 토글 방식
  const handleHabitClick = (habitStat) => {
    if (selectedHabit && selectedHabit.habitId === habitStat.habitId) {
      setSelectedHabit(null); // 같은 습관 클릭시 닫기
    } else {
      setSelectedHabit(habitStat);
    }
  };

  // 선택된 습관의 일별 완료 데이터 계산
  const getHabitDailyData = () => {
    if (!selectedHabit || !stats?.dailyStats) return {};

    const habitDailyData = {};
    Object.entries(stats.dailyStats).forEach(([dateKey, dayStat]) => {
      const habitLog = dayStat.logs?.find(
        log => log.habitId === selectedHabit.habitId
      );
      habitDailyData[dateKey] = {
        completed: habitLog?.completed || false,
        note: habitLog?.note || null,
        completedAt: habitLog?.completedAt || null
      };
    });
    return habitDailyData;
  };

  if (!user.familyId) {
    return (
      <div className="min-h-screen bg-figma-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-figma text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#6B73FF] to-[#3843FF] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-figma">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-figma-black-100 mb-2">그룹에 가입해주세요</h2>
          <p className="text-figma-black-40 text-sm mb-6">
            월간 통계를 보려면 그룹에 속해 있어야 합니다.
          </p>
          <button
            onClick={() => navigate('/family')}
            className="w-full h-12 bg-gradient-to-r from-[#6B73FF] to-[#3843FF] text-white font-medium rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Users className="h-5 w-5" />
            그룹 관리
          </button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-figma-bg pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-figma-black-10 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-6 py-4">
          {/* Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-figma-black-100">
                월간 요약
              </h1>
              <p className="text-sm text-figma-black-40">
                이번 달 습관 달성 현황을 확인하세요
              </p>
            </div>
            <button
              onClick={() => setShowLogoutDialog(true)}
              className="w-10 h-10 bg-figma-black-10 rounded-full flex items-center justify-center hover:bg-figma-black-20 transition-colors"
              title="로그아웃"
            >
              <DoorOpen className="w-5 h-5 text-figma-black-60" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-6 py-4 space-y-4">
        {/* Month Selector - Horizontal Style */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => changeMonth(-1)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl border border-figma-black-10 bg-white dark:bg-gray-800 hover:bg-figma-black-10 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-figma-black-60" />
          </button>
          <div className="flex-1 bg-gradient-to-r from-[#6B73FF] to-[#3843FF] rounded-2xl py-3 px-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5 text-white/80" />
              <span className="text-lg font-semibold text-white">
                {getMonthName()}
              </span>
            </div>
          </div>
          <button
            onClick={() => changeMonth(1)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl border border-figma-black-10 bg-white dark:bg-gray-800 hover:bg-figma-black-10 transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-figma-black-60" />
          </button>
        </div>

        {stats && (
          <>
            {/* User Stats */}
            <div className="bg-white dark:bg-gray-800 border border-figma-black-10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-figma-blue-100" />
                <h3 className="text-sm font-medium text-figma-black-100">그룹 구성원별 통계</h3>
              </div>

              <div className="space-y-3">
                {stats.userStats.map((userStat) => (
                  <div
                    key={userStat.userId}
                    className="bg-figma-bg rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#6B73FF] to-[#3843FF] flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {userStat.displayName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-figma-black-100 text-sm">
                            {userStat.displayName}
                          </h4>
                          <p className="text-[10px] text-figma-black-40">
                            {userStat.completedCount} / {userStat.totalPossible} 완료
                          </p>
                        </div>
                      </div>
                      <span className={`
                        px-2 py-0.5 text-xs font-bold rounded-full
                        ${userStat.completionRate >= 80
                          ? 'bg-green-100 text-green-700'
                          : userStat.completionRate >= 50
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-figma-black-10 text-figma-black-60'
                        }
                      `}>
                        {userStat.completionRate.toFixed(0)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 bg-figma-black-10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6B73FF] to-[#3843FF] transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${Math.min(userStat.completionRate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Habit Stats */}
            <div className="bg-white dark:bg-gray-800 border border-figma-black-10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-4 w-4 text-figma-blue-100" />
                <h3 className="text-sm font-medium text-figma-black-100">습관별 통계</h3>
                <span className="text-[10px] text-figma-black-40">(클릭하여 캘린더 보기)</span>
              </div>

              <div className="space-y-3">
                {stats.habitStats.map((habitStat) => {
                  const isSelected = selectedHabit?.habitId === habitStat.habitId;
                  const habitDailyData = isSelected ? getHabitDailyData() : {};

                  return (
                    <div key={habitStat.habitId}>
                      <div
                        onClick={() => handleHabitClick(habitStat)}
                        className={`bg-figma-bg rounded-xl p-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 ring-offset-1'
                            : 'hover:bg-figma-black-10'
                        }`}
                        style={isSelected ? { ringColor: habitStat.color } : {}}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ChevronRight
                              className={`w-4 h-4 text-figma-black-40 transition-transform ${
                                isSelected ? 'rotate-90' : ''
                              }`}
                            />
                            <div>
                              <h4
                                className="font-medium text-sm mb-0.5"
                                style={{ color: habitStat.color }}
                              >
                                {habitStat.habitName}
                              </h4>
                              <p className="text-[10px] text-figma-black-40">
                                {habitStat.displayName} | {habitStat.completedCount} / {habitStat.totalPossible}
                              </p>
                            </div>
                          </div>
                          <span className={`
                            px-2 py-0.5 text-xs font-bold rounded-full
                            ${habitStat.completionRate >= 80
                              ? 'bg-green-100 text-green-700'
                              : habitStat.completionRate >= 50
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-figma-black-10 text-figma-black-60'
                            }
                          `}>
                            {habitStat.completionRate.toFixed(0)}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 bg-figma-black-10 rounded-full overflow-hidden ml-6">
                          <div
                            className="h-full transition-all duration-500 ease-out rounded-full"
                            style={{
                              backgroundColor: habitStat.color,
                              width: `${Math.min(habitStat.completionRate, 100)}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* 선택된 습관의 월간 캘린더 */}
                      {isSelected && (
                        <div className="mt-3 p-3 bg-white dark:bg-gray-700 border border-figma-black-10 rounded-xl animate-in slide-in-from-top-2 duration-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: habitStat.color }}
                            />
                            <span className="text-xs font-medium text-figma-black-60">
                              {habitStat.habitName} 완료 현황
                            </span>
                          </div>

                          {/* Week Day Headers */}
                          <div className="grid grid-cols-7 gap-1 mb-1">
                            {weekDays.map((day, index) => (
                              <div
                                key={day}
                                className={`text-center font-medium text-[10px] py-1 ${
                                  index === 0
                                    ? 'text-figma-red'
                                    : index === 6
                                    ? 'text-figma-blue-100'
                                    : 'text-figma-black-40'
                                }`}
                              >
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Calendar Grid */}
                          <div className="grid grid-cols-7 gap-1">
                            {Object.entries(stats.dailyStats)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([dateKey]) => {
                                const [year, month, day] = dateKey.split('-').map(Number);
                                const date = new Date(year, month - 1, day);
                                const dayOfWeek = date.getDay();
                                const dayData = habitDailyData[dateKey];
                                const isCompleted = dayData?.completed;

                                return (
                                  <div
                                    key={dateKey}
                                    className={`
                                      aspect-square rounded-lg flex items-center justify-center
                                      transition-all duration-200 text-xs font-medium
                                      ${isCompleted
                                        ? 'text-white'
                                        : 'bg-figma-black-10 text-figma-black-40'
                                      }
                                    `}
                                    style={{
                                      backgroundColor: isCompleted ? habitStat.color : undefined,
                                      gridColumnStart: date.getDate() === 1 ? dayOfWeek + 1 : 'auto'
                                    }}
                                    title={isCompleted ? '완료' : '미완료'}
                                  >
                                    {isCompleted ? (
                                      <Check className="w-3 h-3" />
                                    ) : (
                                      <span className="text-[10px]">{date.getDate()}</span>
                                    )}
                                  </div>
                                );
                              })}
                          </div>

                          {/* 완료 요약 */}
                          <div className="mt-3 pt-2 border-t border-figma-black-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: habitStat.color }}
                                />
                                <span className="text-[10px] text-figma-black-40">완료</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-figma-black-10" />
                                <span className="text-[10px] text-figma-black-40">미완료</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-medium" style={{ color: habitStat.color }}>
                              {habitStat.completedCount}일 완료
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calendar View */}
            <div className="bg-white dark:bg-gray-800 border border-figma-black-10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-figma-blue-100" />
                <h3 className="text-sm font-medium text-figma-black-100">월간 캘린더</h3>
              </div>

              {/* Week Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map((day, index) => (
                  <div
                    key={day}
                    className={`text-center font-medium text-[10px] py-1 ${
                      index === 0
                        ? 'text-figma-red'
                        : index === 6
                        ? 'text-figma-blue-100'
                        : 'text-figma-black-40'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {Object.entries(stats.dailyStats)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dateKey, dayStat]) => {
                    const [year, month, day] = dateKey.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    const dayOfWeek = date.getDay();
                    const completionRate =
                      dayStat.totalHabits > 0
                        ? (dayStat.completedCount / dayStat.totalHabits) * 100
                        : 0;

                    let bgClass = 'bg-figma-black-10';
                    let textClass = 'text-figma-black-40';

                    if (completionRate >= 80) {
                      bgClass = 'bg-green-100';
                      textClass = 'text-green-700';
                    } else if (completionRate >= 50) {
                      bgClass = 'bg-amber-100';
                      textClass = 'text-amber-700';
                    } else if (completionRate > 0) {
                      bgClass = 'bg-red-100';
                      textClass = 'text-red-700';
                    }

                    return (
                      <div
                        key={dateKey}
                        className={`
                          aspect-square rounded-lg flex flex-col items-center justify-center
                          cursor-pointer transition-all duration-200
                          hover:scale-105 hover:shadow-sm
                          ${bgClass}
                        `}
                        style={{
                          gridColumnStart: date.getDate() === 1 ? dayOfWeek + 1 : 'auto'
                        }}
                        title={`${dayStat.completedCount}/${dayStat.totalHabits} 완료 (${completionRate.toFixed(1)}%)`}
                        onClick={() => handleDayClick(dateKey, dayStat)}
                      >
                        <div className={`font-bold text-xs ${textClass}`}>
                          {date.getDate()}
                        </div>
                        <div className="text-[8px] text-figma-black-40">
                          {dayStat.completedCount}/{dayStat.totalHabits}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-3 border-t border-figma-black-10">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-100"></div>
                  <span className="text-[10px] text-figma-black-40">80%+</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-amber-100"></div>
                  <span className="text-[10px] text-figma-black-40">50-79%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-100"></div>
                  <span className="text-[10px] text-figma-black-40">1-49%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-figma-black-10"></div>
                  <span className="text-[10px] text-figma-black-40">0%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Day Detail Dialog */}
      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="rounded-3xl border-0 shadow-figma max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-figma-black-100">
              <Calendar className="h-5 w-5 text-figma-blue-100" />
              {selectedDayData && selectedDayData.dateObj && selectedDayData.dateObj.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short'
              })}
            </DialogTitle>
          </DialogHeader>

          {selectedDayData && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 bg-figma-bg rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-figma-black-40">완료율</span>
                  <span className={`
                    px-3 py-1 text-sm font-bold rounded-full
                    ${selectedDayData.totalHabits > 0 && (selectedDayData.completedCount / selectedDayData.totalHabits * 100) >= 80
                      ? 'bg-green-100 text-green-700'
                      : selectedDayData.totalHabits > 0 && (selectedDayData.completedCount / selectedDayData.totalHabits * 100) >= 50
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-figma-black-10 text-figma-black-60'
                    }
                  `}>
                    {selectedDayData.totalHabits > 0
                      ? `${((selectedDayData.completedCount / selectedDayData.totalHabits) * 100).toFixed(0)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="text-2xl font-bold text-figma-black-100">
                  {selectedDayData.completedCount} / {selectedDayData.totalHabits}
                </div>
                <p className="text-sm text-figma-black-40 mt-1">
                  {selectedDayData.completedCount}개 완료, {selectedDayData.totalHabits - selectedDayData.completedCount}개 미완료
                </p>
              </div>

              {/* Habit List */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-figma-black-60">습관 목록</h3>
                {selectedDayData.logs && selectedDayData.logs.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedDayData.logs.map((log, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-2xl transition-colors ${
                          log.completed
                            ? 'bg-green-50'
                            : 'bg-figma-bg'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`
                            mt-0.5 w-5 h-5 rounded-full flex items-center justify-center
                            ${log.completed ? 'bg-figma-green' : 'bg-figma-black-20'}
                          `}>
                            {log.completed ? (
                              <Check className="h-3 w-3 text-white" />
                            ) : (
                              <X className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${
                              log.completed ? 'text-green-700' : 'text-figma-black-60'
                            }`}>
                              {log.habitName}
                            </p>
                            <p className="text-xs text-figma-black-40 mt-0.5">
                              {log.userName}
                              {log.completed && log.completedAt && (
                                <span className="ml-2">
                                  {new Date(log.completedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </p>
                            {log.note && (
                              <div className="flex items-start gap-1 mt-2 p-2 bg-white dark:bg-gray-800 rounded-xl">
                                <MessageSquare className="w-3 h-3 text-figma-black-40 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-figma-black-60 break-words">{log.note}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-figma-black-40 text-center py-4">
                    이 날짜에 기록된 습관이 없습니다.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-figma-black-10">
        <div className="flex justify-around items-center py-2">
          <button onClick={() => navigate('/')} className="flex flex-col items-center p-2 text-figma-black-40">
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

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="rounded-3xl border-0 shadow-figma max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-figma-black-100">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              로그아웃
            </DialogTitle>
            <DialogDescription className="text-figma-black-40">
              정말 로그아웃하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              onClick={() => setShowLogoutDialog(false)}
              className="flex-1 h-11 bg-figma-black-10 text-figma-black-60 font-medium rounded-xl hover:bg-figma-black-20 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex-1 h-11 bg-figma-blue-100 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              로그아웃
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Monthly;

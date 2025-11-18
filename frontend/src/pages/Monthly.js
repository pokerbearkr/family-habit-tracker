import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { habitLogAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  Home,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3,
  TrendingUp,
  Award,
  Settings,
  Check,
  X
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

  if (!user.familyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">가족에 가입해주세요</CardTitle>
            <CardDescription className="text-center">
              월간 통계를 보려면 가족에 속해 있어야 합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/family')} className="w-full">
              <Users className="mr-2 h-4 w-4" />
              가족 관리
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-muted-foreground">로딩 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">월간 요약</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="h-9 w-9"
              >
                <Home className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/family')}
                className="h-9 w-9"
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/settings')}
                className="h-9 w-9"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (window.confirm('로그아웃하시겠습니까?')) {
                    logout();
                  }
                }}
                className="h-9 w-9"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Month Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeMonth(-1)}
                className="h-10 w-10 shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center justify-center gap-2 flex-1">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl sm:text-2xl font-semibold text-center">
                  {getMonthName()}
                </h2>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeMonth(1)}
                className="h-10 w-10 shrink-0"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {stats && (
          <>
            {/* User Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  가족 구성원별 통계
                </CardTitle>
                <CardDescription>이번 달 가족 구성원들의 습관 달성률</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.userStats.map((userStat) => (
                    <div
                      key={userStat.userId}
                      className="p-4 rounded-lg border bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-lg font-semibold text-blue-600">
                              {userStat.displayName.charAt(0)}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900">
                            {userStat.displayName}
                          </h4>
                        </div>
                        <Badge
                          variant={
                            userStat.completionRate >= 80
                              ? 'default'
                              : userStat.completionRate >= 50
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-sm font-bold"
                        >
                          {userStat.completionRate.toFixed(1)}%
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${userStat.completionRate}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {userStat.completedCount} / {userStat.totalPossible} 완료
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Habit Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  습관별 통계
                </CardTitle>
                <CardDescription>이번 달 습관별 달성률</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.habitStats.map((habitStat) => (
                    <div
                      key={habitStat.habitId}
                      className="p-4 rounded-lg border bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4
                            className="font-semibold text-base mb-1"
                            style={{ color: habitStat.color }}
                          >
                            {habitStat.habitName}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {habitStat.displayName}
                          </p>
                        </div>
                        <Badge
                          variant={
                            habitStat.completionRate >= 80
                              ? 'default'
                              : habitStat.completionRate >= 50
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-sm font-bold shrink-0"
                        >
                          {habitStat.completionRate.toFixed(1)}%
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-500 ease-out rounded-full"
                            style={{
                              backgroundColor: habitStat.color,
                              width: `${habitStat.completionRate}%`
                            }}
                          />
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {habitStat.completedCount} / {habitStat.totalPossible} 완료
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Calendar View */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  월간 캘린더
                </CardTitle>
                <CardDescription>일별 습관 완료 현황</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Week Day Headers */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                  {weekDays.map((day, index) => (
                    <div
                      key={day}
                      className={`text-center font-semibold text-xs sm:text-sm py-2 ${
                        index === 0
                          ? 'text-red-600'
                          : index === 6
                          ? 'text-blue-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {Object.entries(stats.dailyStats)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([dateKey, dayStat]) => {
                      // Parse date string directly to avoid timezone issues
                      const [year, month, day] = dateKey.split('-').map(Number);
                      const date = new Date(year, month - 1, day); // month is 0-indexed
                      const dayOfWeek = date.getDay();
                      const completionRate =
                        dayStat.totalHabits > 0
                          ? (dayStat.completedCount / dayStat.totalHabits) * 100
                          : 0;

                      let bgColorClass = 'bg-gray-100 hover:bg-gray-200';
                      let textColorClass = 'text-gray-600';
                      let borderClass = 'border-gray-200';

                      if (completionRate >= 80) {
                        bgColorClass = 'bg-green-100 hover:bg-green-200';
                        textColorClass = 'text-green-800';
                        borderClass = 'border-green-300';
                      } else if (completionRate >= 50) {
                        bgColorClass = 'bg-yellow-100 hover:bg-yellow-200';
                        textColorClass = 'text-yellow-800';
                        borderClass = 'border-yellow-300';
                      } else if (completionRate > 0) {
                        bgColorClass = 'bg-red-100 hover:bg-red-200';
                        textColorClass = 'text-red-800';
                        borderClass = 'border-red-300';
                      }

                      return (
                        <div
                          key={dateKey}
                          className={`
                            aspect-square p-1 sm:p-2 border rounded-lg
                            flex flex-col items-center justify-center
                            cursor-pointer transition-all duration-200
                            hover:scale-105 hover:shadow-md
                            ${bgColorClass} ${borderClass}
                          `}
                          style={{
                            gridColumnStart: date.getDate() === 1 ? dayOfWeek + 1 : 'auto'
                          }}
                          title={`${dayStat.completedCount}/${dayStat.totalHabits} 완료 (${completionRate.toFixed(1)}%)`}
                          onClick={() => handleDayClick(dateKey, dayStat)}
                        >
                          <div className={`font-bold text-xs sm:text-base ${textColorClass}`}>
                            {date.getDate()}
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-600 whitespace-nowrap">
                            {dayStat.completedCount}/{dayStat.totalHabits}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-green-100 border border-green-300"></div>
                    <span className="text-xs sm:text-sm text-gray-700">80% 이상</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-yellow-100 border border-yellow-300"></div>
                    <span className="text-xs sm:text-sm text-gray-700">50-79%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-red-100 border border-red-300"></div>
                    <span className="text-xs sm:text-sm text-gray-700">1-49%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-gray-100 border border-gray-200"></div>
                    <span className="text-xs sm:text-sm text-gray-700">0%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Day Detail Dialog */}
      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
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
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">완료율</span>
                  <Badge variant={
                    selectedDayData.totalHabits > 0 && (selectedDayData.completedCount / selectedDayData.totalHabits * 100) >= 80
                      ? 'default'
                      : selectedDayData.totalHabits > 0 && (selectedDayData.completedCount / selectedDayData.totalHabits * 100) >= 50
                      ? 'secondary'
                      : 'outline'
                  }>
                    {selectedDayData.totalHabits > 0
                      ? `${((selectedDayData.completedCount / selectedDayData.totalHabits) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedDayData.completedCount} / {selectedDayData.totalHabits}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedDayData.completedCount}개 완료, {selectedDayData.totalHabits - selectedDayData.completedCount}개 미완료
                </p>
              </div>

              {/* Habit List */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-700">습관 목록</h3>
                {selectedDayData.logs && selectedDayData.logs.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedDayData.logs.map((log, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border transition-colors ${
                          log.completed
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {log.completed ? (
                              <Check className="h-5 w-5 text-green-600" />
                            ) : (
                              <X className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${
                                log.completed ? 'text-green-900' : 'text-gray-700'
                              }`}>
                                {log.habitName}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {log.userName}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    이 날짜에 기록된 습관이 없습니다.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Monthly;

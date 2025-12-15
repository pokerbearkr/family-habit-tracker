import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { healthAPI } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import {
  Home,
  Users,
  TrendingUp,
  Settings,
  Calendar as CalendarIcon,
  Plus,
  Heart,
  Activity,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';

const RECORD_TYPES = [
  { value: 'BLOOD_PRESSURE', label: '혈압', icon: Heart, color: '#E3524F' },
  { value: 'WEIGHT', label: '체중', icon: Activity, color: '#3BA935' },
  { value: 'BLOOD_SUGAR', label: '혈당', icon: Activity, color: '#F59E0B' },
  { value: 'HEART_RATE', label: '심박수', icon: Heart, color: '#8B5CF6' }
];

const MEASURE_TIMES = [
  { value: 'MORNING', label: '아침' },
  { value: 'AFTERNOON', label: '점심' },
  { value: 'EVENING', label: '저녁' },
  { value: 'BEFORE_MEAL', label: '식전' },
  { value: 'AFTER_MEAL', label: '식후' }
];

function Health() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('BLOOD_PRESSURE');
  const [viewMode, setViewMode] = useState('my'); // 'my' or 'family'
  const [records, setRecords] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Chart date range (default: 30 days)
  const [chartDays, setChartDays] = useState(30);

  // Form state
  const [formData, setFormData] = useState({
    recordType: 'BLOOD_PRESSURE',
    recordDate: new Date().toISOString().split('T')[0],
    systolic: '',
    diastolic: '',
    heartRate: '',
    weight: '',
    bloodSugar: '',
    note: '',
    measureTime: ''
  });

  const getDateRange = useCallback((days) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }, []);

  const loadRecords = useCallback(async () => {
    try {
      const { startDate, endDate } = getDateRange(chartDays);
      const response = viewMode === 'my'
        ? await healthAPI.getMyRecords(startDate, endDate, activeTab)
        : await healthAPI.getFamilyRecords(startDate, endDate, activeTab);
      setRecords(response.data);
    } catch (error) {
      console.error('Error loading records:', error);
      if (error.response?.status !== 500) {
        toast.error('기록을 불러오는데 실패했습니다');
      }
    }
  }, [activeTab, chartDays, getDateRange, viewMode]);

  const loadChartData = useCallback(async () => {
    try {
      const { startDate, endDate } = getDateRange(chartDays);
      const response = await healthAPI.getChartData(activeTab, startDate, endDate);

      // Transform data for chart
      const transformed = response.data.map(record => ({
        date: record.recordDate,
        systolic: record.systolic,
        diastolic: record.diastolic,
        heartRate: record.heartRate,
        weight: record.weight,
        bloodSugar: record.bloodSugar,
        displayDate: new Date(record.recordDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
      }));

      setChartData(transformed);
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  }, [activeTab, chartDays, getDateRange]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadRecords(), loadChartData()]);
      setLoading(false);
    };
    loadData();
  }, [loadRecords, loadChartData]);

  const handleAddRecord = async () => {
    try {
      const data = {
        recordType: activeTab,
        recordDate: formData.recordDate,
        note: formData.note || null,
        measureTime: formData.measureTime || null
      };

      if (activeTab === 'BLOOD_PRESSURE') {
        if (!formData.systolic || !formData.diastolic) {
          toast.error('수축기와 이완기 혈압을 모두 입력해주세요');
          return;
        }
        data.systolic = parseInt(formData.systolic);
        data.diastolic = parseInt(formData.diastolic);
        data.heartRate = formData.heartRate ? parseInt(formData.heartRate) : null;
      } else if (activeTab === 'WEIGHT') {
        if (!formData.weight) {
          toast.error('체중을 입력해주세요');
          return;
        }
        data.weight = parseFloat(formData.weight);
      } else if (activeTab === 'BLOOD_SUGAR') {
        if (!formData.bloodSugar) {
          toast.error('혈당을 입력해주세요');
          return;
        }
        data.bloodSugar = parseInt(formData.bloodSugar);
      } else if (activeTab === 'HEART_RATE') {
        if (!formData.heartRate) {
          toast.error('심박수를 입력해주세요');
          return;
        }
        data.heartRate = parseInt(formData.heartRate);
      }

      await healthAPI.create(data);
      toast.success('기록이 저장되었습니다');
      setShowAddDialog(false);
      resetForm();
      loadRecords();
      loadChartData();
    } catch (error) {
      console.error('Error adding record:', error);
      toast.error('기록 저장에 실패했습니다');
    }
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord) return;

    try {
      const data = {
        recordType: editingRecord.recordType,
        recordDate: formData.recordDate,
        systolic: formData.systolic ? parseInt(formData.systolic) : null,
        diastolic: formData.diastolic ? parseInt(formData.diastolic) : null,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        bloodSugar: formData.bloodSugar ? parseInt(formData.bloodSugar) : null,
        note: formData.note || null,
        measureTime: formData.measureTime || null
      };

      await healthAPI.update(editingRecord.id, data);
      toast.success('기록이 수정되었습니다');
      setShowEditDialog(false);
      setEditingRecord(null);
      resetForm();
      loadRecords();
      loadChartData();
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error('기록 수정에 실패했습니다');
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('이 기록을 삭제하시겠습니까?')) return;

    try {
      await healthAPI.delete(id);
      toast.success('기록이 삭제되었습니다');
      loadRecords();
      loadChartData();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('기록 삭제에 실패했습니다');
    }
  };

  const openEditDialog = (record) => {
    setEditingRecord(record);
    setFormData({
      recordType: record.recordType,
      recordDate: record.recordDate,
      systolic: record.systolic || '',
      diastolic: record.diastolic || '',
      heartRate: record.heartRate || '',
      weight: record.weight || '',
      bloodSugar: record.bloodSugar || '',
      note: record.note || '',
      measureTime: record.measureTime || ''
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      recordType: activeTab,
      recordDate: new Date().toISOString().split('T')[0],
      systolic: '',
      diastolic: '',
      heartRate: '',
      weight: '',
      bloodSugar: '',
      note: '',
      measureTime: ''
    });
  };

  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const getBloodPressureStatus = (systolic, diastolic) => {
    if (systolic < 120 && diastolic < 80) return { text: '정상', color: 'text-green-500' };
    if (systolic < 130 && diastolic < 80) return { text: '주의', color: 'text-yellow-500' };
    if (systolic < 140 || diastolic < 90) return { text: '고혈압 전단계', color: 'text-orange-500' };
    return { text: '고혈압', color: 'text-red-500' };
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-figma-black-40">
          데이터가 없습니다
        </div>
      );
    }

    if (activeTab === 'BLOOD_PRESSURE') {
      return (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
            <YAxis domain={[60, 180]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <ReferenceLine y={120} stroke="#22c55e" strokeDasharray="5 5" label={{ value: '정상 수축기', fontSize: 10 }} />
            <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="5 5" label={{ value: '정상 이완기', fontSize: 10 }} />
            <Line type="monotone" dataKey="systolic" name="수축기" stroke="#E3524F" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="diastolic" name="이완기" stroke="#3843FF" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (activeTab === 'WEIGHT') {
      return (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
            <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="weight" name="체중(kg)" stroke="#3BA935" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (activeTab === 'BLOOD_SUGAR') {
      return (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
            <YAxis domain={[60, 200]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="5 5" label={{ value: '정상', fontSize: 10 }} />
            <ReferenceLine y={126} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: '당뇨 기준', fontSize: 10 }} />
            <Line type="monotone" dataKey="bloodSugar" name="혈당(mg/dL)" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (activeTab === 'HEART_RATE') {
      return (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
            <YAxis domain={[40, 120]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <ReferenceLine y={60} stroke="#22c55e" strokeDasharray="5 5" />
            <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="5 5" />
            <Line type="monotone" dataKey="heartRate" name="심박수(bpm)" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };

  const renderRecordValue = (record) => {
    switch (record.recordType) {
      case 'BLOOD_PRESSURE':
        const status = getBloodPressureStatus(record.systolic, record.diastolic);
        return (
          <div>
            <span className="text-xl font-bold text-figma-black-100">
              {record.systolic}/{record.diastolic}
            </span>
            <span className="text-sm text-figma-black-40 ml-1">mmHg</span>
            {record.heartRate && (
              <span className="text-sm text-figma-black-40 ml-2">
                {record.heartRate}bpm
              </span>
            )}
            <span className={`ml-2 text-sm ${status.color}`}>{status.text}</span>
          </div>
        );
      case 'WEIGHT':
        return (
          <div>
            <span className="text-xl font-bold text-figma-black-100">{record.weight}</span>
            <span className="text-sm text-figma-black-40 ml-1">kg</span>
          </div>
        );
      case 'BLOOD_SUGAR':
        return (
          <div>
            <span className="text-xl font-bold text-figma-black-100">{record.bloodSugar}</span>
            <span className="text-sm text-figma-black-40 ml-1">mg/dL</span>
          </div>
        );
      case 'HEART_RATE':
        return (
          <div>
            <span className="text-xl font-bold text-figma-black-100">{record.heartRate}</span>
            <span className="text-sm text-figma-black-40 ml-1">bpm</span>
          </div>
        );
      default:
        return null;
    }
  };

  const renderFormFields = () => {
    switch (activeTab) {
      case 'BLOOD_PRESSURE':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>수축기 (mmHg)</Label>
                <Input
                  type="number"
                  value={formData.systolic}
                  onChange={(e) => setFormData({ ...formData, systolic: e.target.value })}
                  placeholder="120"
                />
              </div>
              <div>
                <Label>이완기 (mmHg)</Label>
                <Input
                  type="number"
                  value={formData.diastolic}
                  onChange={(e) => setFormData({ ...formData, diastolic: e.target.value })}
                  placeholder="80"
                />
              </div>
            </div>
            <div>
              <Label>맥박 (선택)</Label>
              <Input
                type="number"
                value={formData.heartRate}
                onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                placeholder="72"
              />
            </div>
          </>
        );
      case 'WEIGHT':
        return (
          <div>
            <Label>체중 (kg)</Label>
            <Input
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="65.0"
            />
          </div>
        );
      case 'BLOOD_SUGAR':
        return (
          <div>
            <Label>혈당 (mg/dL)</Label>
            <Input
              type="number"
              value={formData.bloodSugar}
              onChange={(e) => setFormData({ ...formData, bloodSugar: e.target.value })}
              placeholder="100"
            />
          </div>
        );
      case 'HEART_RATE':
        return (
          <div>
            <Label>심박수 (bpm)</Label>
            <Input
              type="number"
              value={formData.heartRate}
              onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
              placeholder="72"
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-figma-bg pb-24">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-figma-black-10 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-figma-black-100">
                건강 기록
              </h1>
              <p className="text-sm text-figma-black-40">
                혈압, 체중, 혈당을 기록하세요
              </p>
            </div>
            <Button
              onClick={openAddDialog}
              className="bg-figma-blue-100 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              기록
            </Button>
          </div>
          {/* View Mode Toggle */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setViewMode('my')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'my'
                  ? 'bg-figma-blue-100 text-white'
                  : 'bg-figma-black-10 text-figma-black-60'
              }`}
            >
              내 기록
            </button>
            <button
              onClick={() => setViewMode('family')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'family'
                  ? 'bg-figma-blue-100 text-white'
                  : 'bg-figma-black-10 text-figma-black-60'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1" />
              가족 기록
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-figma-black-10">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex overflow-x-auto">
            {RECORD_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setActiveTab(type.value)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === type.value
                    ? 'border-figma-blue-100 text-figma-blue-100'
                    : 'border-transparent text-figma-black-40 hover:text-figma-black-60'
                }`}
              >
                <type.icon className="w-4 h-4" style={{ color: type.color }} />
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Chart Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-figma-black-100">추이 그래프</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartDays(7)}
                className={`px-2 py-1 text-xs rounded ${chartDays === 7 ? 'bg-figma-blue-100 text-white' : 'bg-figma-black-10 text-figma-black-60'}`}
              >
                7일
              </button>
              <button
                onClick={() => setChartDays(30)}
                className={`px-2 py-1 text-xs rounded ${chartDays === 30 ? 'bg-figma-blue-100 text-white' : 'bg-figma-black-10 text-figma-black-60'}`}
              >
                30일
              </button>
              <button
                onClick={() => setChartDays(90)}
                className={`px-2 py-1 text-xs rounded ${chartDays === 90 ? 'bg-figma-blue-100 text-white' : 'bg-figma-black-10 text-figma-black-60'}`}
              >
                90일
              </button>
            </div>
          </div>
          {renderChart()}
        </Card>

        {/* Recent Records */}
        <Card className="p-4">
          <h2 className="font-medium text-figma-black-100 mb-4">최근 기록</h2>
          {loading ? (
            <div className="text-center py-8 text-figma-black-40">로딩 중...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-figma-black-40">
              기록이 없습니다. 첫 기록을 추가해보세요!
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => {
                const isMyRecord = record.userId === user?.id;
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-figma-black-5 rounded-xl"
                  >
                    <div>
                      <div className="text-sm text-figma-black-40 mb-1">
                        {viewMode === 'family' && (
                          <span className="font-medium text-figma-blue-100 mr-2">
                            {record.userDisplayName}
                          </span>
                        )}
                        {new Date(record.recordDate).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                        {record.measureTime && (
                          <span className="ml-2">
                            {MEASURE_TIMES.find(m => m.value === record.measureTime)?.label}
                          </span>
                        )}
                      </div>
                      {renderRecordValue(record)}
                      {record.note && (
                        <p className="text-sm text-figma-black-40 mt-1">{record.note}</p>
                      )}
                    </div>
                    {isMyRecord && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditDialog(record)}
                          className="p-2 text-figma-black-40 hover:text-figma-blue-100"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="p-2 text-figma-black-40 hover:text-figma-red"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </main>

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
          <button className="flex flex-col items-center p-2 text-figma-blue-100">
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

      {/* Add Record Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {RECORD_TYPES.find(t => t.value === activeTab)?.label} 기록
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>날짜</Label>
              <Input
                type="date"
                value={formData.recordDate}
                onChange={(e) => setFormData({ ...formData, recordDate: e.target.value })}
              />
            </div>

            {renderFormFields()}

            <div>
              <Label>측정 시간 (선택)</Label>
              <select
                value={formData.measureTime}
                onChange={(e) => setFormData({ ...formData, measureTime: e.target.value })}
                className="w-full p-2 border border-figma-black-10 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="">선택 안함</option>
                {MEASURE_TIMES.map((time) => (
                  <option key={time.value} value={time.value}>{time.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>메모 (선택)</Label>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="메모를 입력하세요"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              취소
            </Button>
            <Button onClick={handleAddRecord} className="bg-figma-blue-100 text-white">
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>기록 수정</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>날짜</Label>
              <Input
                type="date"
                value={formData.recordDate}
                onChange={(e) => setFormData({ ...formData, recordDate: e.target.value })}
              />
            </div>

            {editingRecord && (
              <>
                {editingRecord.recordType === 'BLOOD_PRESSURE' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>수축기 (mmHg)</Label>
                        <Input
                          type="number"
                          value={formData.systolic}
                          onChange={(e) => setFormData({ ...formData, systolic: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>이완기 (mmHg)</Label>
                        <Input
                          type="number"
                          value={formData.diastolic}
                          onChange={(e) => setFormData({ ...formData, diastolic: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>맥박 (선택)</Label>
                      <Input
                        type="number"
                        value={formData.heartRate}
                        onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                      />
                    </div>
                  </>
                )}
                {editingRecord.recordType === 'WEIGHT' && (
                  <div>
                    <Label>체중 (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    />
                  </div>
                )}
                {editingRecord.recordType === 'BLOOD_SUGAR' && (
                  <div>
                    <Label>혈당 (mg/dL)</Label>
                    <Input
                      type="number"
                      value={formData.bloodSugar}
                      onChange={(e) => setFormData({ ...formData, bloodSugar: e.target.value })}
                    />
                  </div>
                )}
                {editingRecord.recordType === 'HEART_RATE' && (
                  <div>
                    <Label>심박수 (bpm)</Label>
                    <Input
                      type="number"
                      value={formData.heartRate}
                      onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <Label>측정 시간 (선택)</Label>
              <select
                value={formData.measureTime}
                onChange={(e) => setFormData({ ...formData, measureTime: e.target.value })}
                className="w-full p-2 border border-figma-black-10 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="">선택 안함</option>
                {MEASURE_TIMES.map((time) => (
                  <option key={time.value} value={time.value}>{time.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>메모 (선택)</Label>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="메모를 입력하세요"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              취소
            </Button>
            <Button onClick={handleUpdateRecord} className="bg-figma-blue-100 text-white">
              수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Health;

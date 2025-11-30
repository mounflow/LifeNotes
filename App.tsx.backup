import React, { useState, useEffect, useMemo } from 'react';
import { WorkItem, Series } from './types';
import { getStoredItems, saveItem, updateItem, deleteItem, getStoredSeries, saveSeries, updateSeries, deleteSeries } from './services/storage';
import { startOfWeek, endOfWeek, isWithinInterval, subWeeks, addWeeks, format } from 'date-fns';
import WorkInput from './components/WorkInput';
import Dashboard from './components/Dashboard';
import ReportGenerator from './components/ReportGenerator';
import SeriesView from './components/SeriesView';
import { LayoutDashboard, PenTool, ChevronLeft, ChevronRight, Book, Plus, Home, FileText, Target } from 'lucide-react';

const App: React.FC = () => {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'log' | 'series' | 'report'>('log');
  
  // Mobile UI States
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [preSelectedSeriesId, setPreSelectedSeriesId] = useState<string>('');

  useEffect(() => {
    setItems(getStoredItems());
    setSeriesList(getStoredSeries());
  }, []);

  const handleAddItem = (item: WorkItem) => {
    const updated = saveItem(item);
    setItems(updated);
    setIsInputModalOpen(false);
    setPreSelectedSeriesId('');
  };

  const handleUpdateItem = (item: WorkItem) => {
    const updated = updateItem(item);
    setItems(updated);
    setEditingItem(null);
    setIsInputModalOpen(false);
    setPreSelectedSeriesId('');
  }

  const handleDeleteItem = (id: string) => {
    if(window.confirm('确定要删除这条笔记吗？')) {
        const updated = deleteItem(id);
        setItems(updated);
    }
  };

  // --- Series Handlers ---
  const handleAddSeries = (series: Series) => {
      const updated = saveSeries(series);
      setSeriesList(updated);
  }
  const handleUpdateSeries = (series: Series) => {
      const updated = updateSeries(series);
      setSeriesList(updated);
  }
  const handleDeleteSeries = (id: string) => {
      const updated = deleteSeries(id);
      setSeriesList(updated);
  }

  const startEdit = (item: WorkItem) => {
      setEditingItem(item);
      setIsInputModalOpen(true);
  }

  const startAddWithSeries = (seriesId: string) => {
      setEditingItem(null);
      setPreSelectedSeriesId(seriesId);
      setIsInputModalOpen(true);
  }

  // Calculate week range
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const currentWeekItems = useMemo(() => {
    return items.filter(item => 
      isWithinInterval(new Date(item.date), { start: weekStart, end: weekEnd })
    );
  }, [items, weekStart, weekEnd]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* 1. Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200">
             <Book className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Life<span className="text-indigo-600">Notes</span></h1>
        </div>
        
        <nav className="p-4 space-y-1 flex-1">
          <button 
            onClick={() => setActiveTab('log')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
              ${activeTab === 'log' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            笔记库
          </button>

          <button 
            onClick={() => setActiveTab('series')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
              ${activeTab === 'series' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
          >
            <Target className="w-5 h-5" />
            专题目标
          </button>
          
          <button 
            onClick={() => setActiveTab('report')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
              ${activeTab === 'report' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
          >
            <PenTool className="w-5 h-5" />
            周度复盘
          </button>
        </nav>

        <div className="p-4">
             <button 
                onClick={() => { setEditingItem(null); setPreSelectedSeriesId(''); setIsInputModalOpen(true); }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl shadow-md font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
             >
                 <Plus className="w-5 h-5" />
                 记一笔
             </button>
        </div>
      </aside>

      {/* 2. Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative">
        <div className="max-w-6xl mx-auto min-h-full flex flex-col">
          
          {/* Header (Date Nav - only for Log and Report tabs) */}
          <header className="px-4 py-4 md:px-8 md:py-6 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 flex items-center justify-between">
            <div className="md:hidden flex items-center gap-2">
                 <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Book className="text-white w-4 h-4" />
                </div>
                <span className="font-bold text-slate-800">LifeNotes</span>
            </div>

            <div className="hidden md:block">
              <h2 className="text-xl font-bold text-slate-800">
                {activeTab === 'log' ? '我的笔记' : activeTab === 'series' ? '专题管理' : '周报中心'}
              </h2>
            </div>
            
            {activeTab !== 'series' && (
                <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                <button onClick={() => navigateWeek('prev')} className="p-1.5 hover:bg-slate-50 rounded text-slate-500">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-3 text-sm font-medium text-slate-700 flex items-center gap-2 tabular-nums">
                    <CalendarIcon className="w-4 h-4 text-slate-400 hidden sm:block" />
                    {format(weekStart, 'MM/dd')} - {format(weekEnd, 'MM/dd')}
                </div>
                <button onClick={() => navigateWeek('next')} className="p-1.5 hover:bg-slate-50 rounded text-slate-500">
                    <ChevronRight className="w-5 h-5" />
                </button>
                </div>
            )}
          </header>

          {/* Content Body */}
          <div className="flex-1 p-4 md:p-8">
            {activeTab === 'log' && (
              <Dashboard items={currentWeekItems} onDelete={handleDeleteItem} onEdit={startEdit} />
            )}
            {activeTab === 'series' && (
                <SeriesView 
                    seriesList={seriesList}
                    allItems={items}
                    onAddSeries={handleAddSeries}
                    onUpdateSeries={handleUpdateSeries}
                    onDeleteSeries={handleDeleteSeries}
                    onAddItemToSeries={startAddWithSeries}
                />
            )}
            {activeTab === 'report' && (
              <ReportGenerator items={currentWeekItems} startDate={weekStart} endDate={weekEnd} />
            )}
          </div>
        </div>
      </main>

      {/* 3. Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around items-center px-2 py-2 z-30 pb-safe">
        <button 
            onClick={() => setActiveTab('log')}
            className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'log' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
            <Home className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">首页</span>
        </button>

        <button 
            onClick={() => setActiveTab('series')}
            className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'series' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
            <Target className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">专题</span>
        </button>
        
        {/* Mobile FAB in Bottom Nav */}
        <div className="relative -top-6">
            <button 
                onClick={() => { setEditingItem(null); setPreSelectedSeriesId(''); setIsInputModalOpen(true); }}
                className="w-14 h-14 bg-indigo-600 rounded-full text-white shadow-lg shadow-indigo-200 flex items-center justify-center transform active:scale-95 transition-all"
            >
                <Plus className="w-8 h-8" />
            </button>
        </div>

        <button 
            onClick={() => setActiveTab('report')}
            className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'report' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
            <FileText className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">周报</span>
        </button>
      </nav>

      {/* 4. Input Modal (For both Mobile & Desktop "Add Note" action) */}
      {isInputModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 md:p-4">
              <div className="bg-white w-full h-[90vh] md:h-auto md:max-w-2xl rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                  <WorkInput 
                    onSave={editingItem ? handleUpdateItem : handleAddItem} 
                    onCancel={() => { setIsInputModalOpen(false); setEditingItem(null); setPreSelectedSeriesId(''); }}
                    initialData={editingItem}
                    preSelectedSeriesId={preSelectedSeriesId}
                    className="h-full md:h-[600px]"
                  />
              </div>
          </div>
      )}

    </div>
  );
};

const CalendarIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
)

export default App;
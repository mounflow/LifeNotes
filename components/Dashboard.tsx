import React, { useMemo, useState } from 'react';
import { WorkItem, WeeklyStats, Category, CATEGORY_LABELS } from '../types';
import { 
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, XAxis, CartesianGrid 
} from 'recharts';
import { Clock, BookOpen, Search, Edit2, Filter, Trash2, Activity, Calendar } from 'lucide-react';
import { subDays, format, eachDayOfInterval, startOfWeek, endOfWeek, getDay, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DashboardProps {
  items: WorkItem[];
  onDelete: (id: string) => void;
  onEdit: (item: WorkItem) => void;
}

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#94a3b8'];

// Simple Markdown Parser for display
const renderMarkdown = (text: string) => {
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^- (.*)/gm, '• $1');
    html = html.replace(/^# (.*)/gm, '<span class="font-bold text-slate-900">$1</span>');
    html = html.replace(/^> (.*)/gm, '<span class="block border-l-4 border-slate-300 pl-2 text-slate-500 italic my-1">$1</span>');
    return { __html: html };
};

// --- Contribution Heatmap Component ---
const ActivityHeatmap: React.FC<{ items: WorkItem[] }> = ({ items }) => {
    // Show last ~16 weeks (approx 4 months) to fit nicely on screens
    const today = new Date();
    const startDate = startOfWeek(subDays(today, 112), { weekStartsOn: 1 }); // 16 weeks ago
    const endDate = endOfWeek(today, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Calculate intensity map
    const activityMap = useMemo(() => {
        const map = new Map<string, number>();
        items.forEach(item => {
            const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
            map.set(dateKey, (map.get(dateKey) || 0) + 1);
        });
        return map;
    }, [items]);

    const getColor = (count: number) => {
        if (count === 0) return 'bg-slate-100';
        if (count === 1) return 'bg-indigo-200';
        if (count <= 3) return 'bg-indigo-400';
        return 'bg-indigo-600';
    };

    // Group by weeks for Grid Layout
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    days.forEach((day) => {
        if (getDay(day) === 1 && currentWeek.length > 0) { // Monday
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(day);
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="flex items-center gap-2 mb-3 text-slate-700 font-medium text-sm">
                <Activity className="w-4 h-4 text-indigo-500" />
                <span className="flex-1">活跃足迹</span>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>少</span>
                    <div className="w-2 h-2 bg-slate-100 rounded-[1px]" />
                    <div className="w-2 h-2 bg-indigo-200 rounded-[1px]" />
                    <div className="w-2 h-2 bg-indigo-400 rounded-[1px]" />
                    <div className="w-2 h-2 bg-indigo-600 rounded-[1px]" />
                    <span>多</span>
                </div>
            </div>
            
            <div className="overflow-x-auto pb-2 custom-scrollbar">
                <div className="flex gap-[3px] min-w-max">
                    {weeks.map((week, wIndex) => (
                        <div key={wIndex} className="flex flex-col gap-[3px]">
                            {week.map((day, dIndex) => {
                                const dateKey = format(day, 'yyyy-MM-dd');
                                const count = activityMap.get(dateKey) || 0;
                                return (
                                    <div 
                                        key={dateKey}
                                        title={`${dateKey}: ${count} 记录`}
                                        className={`w-2.5 h-2.5 rounded-[2px] ${getColor(count)} transition-colors hover:ring-1 ring-slate-400`}
                                    />
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                 <span>最近 4 个月</span>
                 <span>今天</span>
            </div>
        </div>
    )
}

const Dashboard: React.FC<DashboardProps> = ({ items, onDelete, onEdit }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter(item => 
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        CATEGORY_LABELS[item.category].includes(searchQuery)
    );
  }, [items, searchQuery]);
  
  const stats: WeeklyStats = useMemo(() => {
    const totalMinutes = items.reduce((acc, item) => acc + item.durationMinutes, 0);
    
    // Category Distribution
    const catMap = new Map<string, number>();
    Object.values(Category).forEach(c => catMap.set(CATEGORY_LABELS[c], 0));
    items.forEach(item => {
      const label = CATEGORY_LABELS[item.category] || item.category;
      catMap.set(label, (catMap.get(label) || 0) + item.durationMinutes);
    });
    const categoryDistribution = Array.from(catMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(i => i.value > 0);

    // Daily Distribution
    const dayMap = new Map<string, number>();
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    days.forEach(d => dayMap.set(d, 0));
    
    items.forEach(item => {
      const dayName = days[new Date(item.date).getDay()];
      dayMap.set(dayName, (dayMap.get(dayName) || 0) + item.durationMinutes);
    });

    const dailyDistribution = Array.from(dayMap.entries()).map(([name, minutes]) => ({ name, minutes }));

    return { totalMinutes, categoryDistribution, dailyDistribution };
  }, [items]);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      
      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
            type="text" 
            placeholder="搜索笔记标题、内容、分类..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-slate-700 placeholder:text-slate-400 bg-transparent"
        />
        {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 text-xs bg-slate-100 px-2 py-1 rounded-full">
                清除
            </button>
        )}
      </div>

      {/* Charts Area (Only show if no search to keep search clean) */}
      {!searchQuery && (
        <>
            <ActivityHeatmap items={items} />

            {items.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Time Stats (Simplified) */}
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-xs text-slate-400 mb-1">本周总投入</span>
                            <span className="text-2xl font-bold text-slate-800 font-mono">
                                {Math.floor(stats.totalMinutes / 60)}<span className="text-sm text-slate-400 mx-1">h</span>
                                {stats.totalMinutes % 60}<span className="text-sm text-slate-400 mx-1">m</span>
                            </span>
                         </div>
                         <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center">
                             <Clock className="w-5 h-5 text-indigo-500" />
                         </div>
                    </div>
                     <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-xs text-slate-400 mb-1">本周记录数</span>
                            <span className="text-2xl font-bold text-slate-800 font-mono">
                                {items.length}<span className="text-sm text-slate-400 mx-1">条</span>
                            </span>
                         </div>
                         <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center">
                             <BookOpen className="w-5 h-5 text-pink-500" />
                         </div>
                    </div>
                </div>
            )}
            
            {items.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex overflow-x-auto gap-4 snap-x">
                        <div className="min-w-[280px] h-48 snap-center">
                            <p className="text-xs text-slate-500 mb-2 font-medium">精力分布</p>
                            <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                data={stats.categoryDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                                >
                                {stats.categoryDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                                </Pie>
                                <ReTooltip />
                                <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}} layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="min-w-[280px] h-48 snap-center border-l border-slate-50 pl-4">
                             <p className="text-xs text-slate-500 mb-2 font-medium">每日趋势</p>
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.dailyDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                    <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </>
      )}

      {/* Note List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800 px-1 flex justify-between items-center text-sm uppercase tracking-wider text-slate-500">
            {searchQuery ? '搜索结果' : '近期笔记'}
        </h3>
        
        {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    {searchQuery ? <Filter className="w-6 h-6 opacity-40" /> : <BookOpen className="w-8 h-8 opacity-40" />}
                </div>
                <p className="text-sm">{searchQuery ? '没有找到相关笔记' : '还没有记录，去写点什么吧'}</p>
            </div>
        )}

        {filteredItems.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative">
              <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border
                        ${item.category === Category.Article ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                          item.category === Category.Note ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          item.category === Category.Idea ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                          item.category === Category.Life ? 'bg-green-50 text-green-700 border-green-100' :
                          'bg-slate-50 text-slate-600 border-slate-100'
                        }
                    `}>
                        {CATEGORY_LABELS[item.category] || item.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                        {format(new Date(item.date), 'MM月dd日 HH:mm', { locale: zhCN })}
                    </span>
                 </div>
                 
                 {/* Action Buttons */}
                 <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="编辑"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="删除"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                 </div>
              </div>

              {item.title && (
                  <h3 className="text-base font-bold text-slate-800 mb-2">{item.title}</h3>
              )}
              
              <div 
                className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap markdown-content"
                dangerouslySetInnerHTML={renderMarkdown(item.content)}
              />
              
              {item.durationMinutes > 0 && (
                <div className="mt-3 flex items-center justify-end opacity-60">
                    <Clock className="w-3 h-3 text-slate-400 mr-1" />
                    <span className="text-[10px] text-slate-400">{item.durationMinutes} min</span>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, CheckCircle2, Save, X, Target, Clock, Tag, ChevronDown, Check, Play, Pause, RotateCcw } from 'lucide-react';
import { Category, WorkItem, Series, CATEGORY_LABELS } from '../types';
import { suggestCategory } from '../services/gemini';
import { getStoredSeries } from '../services/storage';
import RichEditor from './RichEditor';

interface WorkInputProps {
  onSave: (item: WorkItem) => void;
  onCancel?: () => void;
  initialData?: WorkItem | null;
  className?: string;
  preSelectedSeriesId?: string;
}

const WorkInput: React.FC<WorkInputProps> = ({ onSave, onCancel, initialData, className, preSelectedSeriesId }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [duration, setDuration] = useState<string>('15'); // Default manual duration
  const [category, setCategory] = useState<Category>(Category.Note);
  const [seriesId, setSeriesId] = useState<string>('');
  
  // Timer State
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [activeSeries, setActiveSeries] = useState<Series[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // UI States for Dropdowns
  const [showSeriesSelector, setShowSeriesSelector] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showDurationInput, setShowDurationInput] = useState(false);

  useEffect(() => {
    const allSeries = getStoredSeries();
    setActiveSeries(allSeries.filter(s => s.status === 'active'));
  }, []);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content);
      setDuration(initialData.durationMinutes.toString());
      setCategory(initialData.category);
      setSeriesId(initialData.seriesId || '');
      // When editing, we usually don't resume a timer, so we leave timer state at 0
    } else {
      setTitle('');
      setContent('');
      setDuration('15');
      setCategory(Category.Note);
      setSeriesId(preSelectedSeriesId || '');
      setElapsedSeconds(0);
      setIsTimerRunning(false);
    }
  }, [initialData, preSelectedSeriesId]);

  // Timer Logic
  useEffect(() => {
    if (isTimerRunning) {
        timerRef.current = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
    } else {
        if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const toggleTimer = () => {
      setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
      setIsTimerRunning(false);
      setElapsedSeconds(0);
  };

  const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !title.trim()) return;

    // Calculate final duration: Timer > 0 ? Timer : Manual Input
    let finalDuration = parseInt(duration) || 0;
    if (elapsedSeconds > 0) {
        // Round up to nearest minute, minimum 1 minute if timer was used
        finalDuration = Math.max(1, Math.ceil(elapsedSeconds / 60));
    }

    const newItem: WorkItem = {
      id: initialData ? initialData.id : crypto.randomUUID(),
      title: title.trim(),
      content: content,
      category: category,
      date: initialData ? initialData.date : new Date().toISOString(),
      durationMinutes: finalDuration,
      seriesId: seriesId || undefined,
    };

    onSave(newItem);
    
    if (!initialData) {
      setTitle('');
      setContent('');
      setJustAdded(true);
      if(!preSelectedSeriesId) setSeriesId('');
      resetTimer(); // Reset timer after save
      setDuration('15'); // Reset manual duration
      setTimeout(() => setJustAdded(false), 2000);
    }
  };

  const handleAutoClassify = async () => {
    if (!content.trim() && !title.trim()) return;
    setIsSuggesting(true);
    try {
        const textToAnalyze = title ? `${title}\n${content}` : content;
        const suggested = await suggestCategory(textToAnalyze);
        const match = Object.values(Category).find(c => c.toLowerCase() === suggested.toLowerCase());
        if (match) setCategory(match);
    } catch (error) {
        // Silent fail
    } finally {
        setIsSuggesting(false);
    }
  }

  // Get current series title for display
  const currentSeriesTitle = activeSeries.find(s => s.id === seriesId)?.title;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 relative overflow-hidden flex flex-col h-full ${className}`}>
      {justAdded && !initialData && (
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-pulse z-10" />
      )}
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
        <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
          {initialData ? '编辑记录' : '新记录'}
        </h2>
        
        {/* Auto Classify Button */}
        <button
            type="button"
            onClick={handleAutoClassify}
            disabled={(!content && !title) || isSuggesting}
            className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors"
        >
            {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI 识别
        </button>

        {onCancel && (
          <button onClick={onCancel} className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        
        <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Title Input */}
            <div className="px-4 pt-4">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="标题 (可选)..."
                    className="w-full text-lg font-bold placeholder:text-slate-300 border-b border-transparent focus:border-slate-100 outline-none py-2 transition-colors bg-transparent"
                />
            </div>

            {/* Editor Area */}
            <div className="p-4 flex-1 min-h-[150px]">
                <RichEditor 
                    value={content} 
                    onChange={setContent} 
                    placeholder="在此记录文章、想法或生活碎片..."
                    className="h-full border-none shadow-none focus-within:ring-0 min-h-full"
                />
            </div>
        </div>

        {/* Footer Toolbar - Redesigned */}
        <div className="p-3 bg-white border-t border-slate-100 space-y-3 flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            
            {/* Metadata Row: Category & Series & Duration Pills */}
            <div className="flex flex-wrap items-center gap-2">
                
                {/* Category Selector Pill */}
                <div className="relative">
                    <button 
                        type="button"
                        onClick={() => { setShowCategorySelector(!showCategorySelector); setShowSeriesSelector(false); setShowDurationInput(false); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs text-slate-700 font-medium transition-colors"
                    >
                        <Tag className="w-3 h-3 text-slate-500" />
                        {CATEGORY_LABELS[category]}
                    </button>
                    {showCategorySelector && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowCategorySelector(false)} />
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                {Object.values(Category).map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => { setCategory(c); setShowCategorySelector(false); }}
                                        className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center justify-between
                                            ${category === c ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-slate-600'}
                                        `}
                                    >
                                        {CATEGORY_LABELS[c]}
                                        {category === c && <Check className="w-3 h-3" />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Series Selector Pill */}
                {activeSeries.length > 0 && (
                    <div className="relative">
                         <button 
                            type="button"
                            onClick={() => { setShowSeriesSelector(!showSeriesSelector); setShowCategorySelector(false); setShowDurationInput(false); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
                                ${seriesId ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 border-dashed'}
                            `}
                        >
                            <Target className={`w-3 h-3 ${seriesId ? 'text-indigo-600' : 'text-slate-400'}`} />
                            {seriesId ? currentSeriesTitle : '关联专题'}
                        </button>
                        
                        {showSeriesSelector && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowSeriesSelector(false)} />
                                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-slate-100 z-20 p-2 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="text-[10px] font-semibold text-slate-400 mb-2 px-1 uppercase tracking-wider">选择专题</div>
                                    <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                                        <button
                                             type="button"
                                             onClick={() => { setSeriesId(''); setShowSeriesSelector(false); }}
                                             className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors border border-transparent
                                                ${!seriesId ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}
                                             `}
                                        >
                                            不关联
                                        </button>
                                        {activeSeries.map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => { setSeriesId(s.id); setShowSeriesSelector(false); }}
                                                className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-between border
                                                    ${seriesId === s.id 
                                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100 font-medium' 
                                                        : 'text-slate-700 border-transparent hover:bg-slate-50'
                                                    }
                                                `}
                                            >
                                                <span className="truncate">{s.title}</span>
                                                {seriesId === s.id && <Check className="w-3 h-3 flex-shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Duration/Timer Controls */}
                <div className="relative ml-auto flex items-center gap-1">
                    <button
                        type="button"
                        onClick={toggleTimer}
                        className={`p-1.5 rounded-full transition-all ${
                            isTimerRunning 
                            ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 ring-2 ring-indigo-50' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-indigo-500'
                        }`}
                        title={isTimerRunning ? "暂停计时" : "开始计时"}
                    >
                        {isTimerRunning ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                    </button>

                    <button 
                         type="button"
                         onClick={() => { 
                             setShowDurationInput(!showDurationInput); 
                             setShowCategorySelector(false); 
                             setShowSeriesSelector(false); 
                         }}
                         className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors
                            ${(isTimerRunning || elapsedSeconds > 0) 
                                ? 'text-indigo-600 font-mono font-medium' 
                                : 'text-slate-400 hover:text-slate-600'
                            }
                         `}
                    >
                         {isTimerRunning || elapsedSeconds > 0 ? (
                             formatTime(elapsedSeconds)
                         ) : (
                             <><Clock className="w-3 h-3" /> {duration}m</>
                         )}
                    </button>
                    
                    {/* Manual Input Popup */}
                     {showDurationInput && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowDurationInput(false)} />
                            <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-lg shadow-xl border border-slate-100 z-20 p-3 animate-in fade-in zoom-in-95 duration-100">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] text-slate-500">手动输入 (分钟)</label>
                                    {(elapsedSeconds > 0 || isTimerRunning) && (
                                        <button 
                                            type="button" 
                                            onClick={() => { resetTimer(); setShowDurationInput(false); }}
                                            className="text-[10px] text-red-400 hover:text-red-500 flex items-center gap-0.5"
                                        >
                                            <RotateCcw className="w-3 h-3" /> 重置
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    step="5"
                                    value={duration}
                                    onChange={(e) => {
                                        setDuration(e.target.value);
                                        // If user types manually, pause/reset timer to avoid confusion
                                        if(isTimerRunning || elapsedSeconds > 0) resetTimer();
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-slate-200 rounded outline-none focus:border-indigo-500"
                                    autoFocus
                                />
                                <div className="flex gap-1 mt-2">
                                    {[15, 30, 60].map(m => (
                                        <button 
                                            key={m}
                                            type="button"
                                            onClick={() => { 
                                                setDuration(m.toString()); 
                                                resetTimer();
                                                setShowDurationInput(false); 
                                            }}
                                            className="flex-1 text-[10px] bg-slate-50 hover:bg-slate-100 py-1 rounded text-slate-600"
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                {onCancel && (
                    <button 
                        type="button" 
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                        取消
                    </button>
                )}
                <button
                    type="submit"
                    disabled={!content.trim() && !title.trim()}
                    className={`flex-1 font-medium py-2.5 rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 text-sm
                        ${justAdded && !initialData
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:shadow-none'}
                    `}
                >
                    {justAdded && !initialData ? (
                        <>
                        <CheckCircle2 className="w-4 h-4" />
                        已保存
                        </>
                    ) : (
                        <>
                        <Save className="w-4 h-4" />
                        {initialData ? '更新' : '保存'}
                        </>
                    )}
                </button>
            </div>
        </div>
      </form>
    </div>
  );
};

export default WorkInput;
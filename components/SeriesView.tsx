import React, { useState, useMemo } from 'react';
import { Series, WorkItem } from '../types';
import { Plus, Target, CheckCircle, Clock, ChevronRight, BookOpen, Trash2, ArrowLeft, Sparkles, Loader2, Download } from 'lucide-react';
import { generateSeriesConclusion } from '../services/gemini';

interface SeriesViewProps {
  seriesList: Series[];
  allItems: WorkItem[];
  onAddSeries: (series: Series) => void;
  onUpdateSeries: (series: Series) => void;
  onDeleteSeries: (id: string) => void;
  onAddItemToSeries: (seriesId: string) => void;
}

// Simple Markdown Render for Reports
const renderMarkdown = (text: string) => {
    // Basic bold/header/list parsing
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^# (.*)/gm, '<h3 class="text-lg font-bold mt-4 mb-2 text-slate-800">$1</h3>');
    html = html.replace(/^## (.*)/gm, '<h4 class="font-bold mt-3 mb-1 text-slate-800">$1</h4>');
    html = html.replace(/^- (.*)/gm, '<li class="ml-4 list-disc">$1</li>');
    return { __html: html };
};

const SeriesView: React.FC<SeriesViewProps> = ({ 
  seriesList, allItems, onAddSeries, onUpdateSeries, onDeleteSeries, onAddItemToSeries 
}) => {
  const [viewState, setViewState] = useState<'list' | 'detail'>('list');
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create Series Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Report Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newTitle) return;
    const newSeries: Series = {
      id: crypto.randomUUID(),
      title: newTitle,
      description: newDesc,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    onAddSeries(newSeries);
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  const openDetail = (series: Series) => {
    setSelectedSeries(series);
    setViewState('detail');
    setReport(''); // Reset report when opening new series
  };

  const handleGenerateReport = async () => {
    if(!selectedSeries) return;
    const items = allItems.filter(i => i.seriesId === selectedSeries.id);
    if(items.length === 0) return;

    setIsGenerating(true);
    try {
        const result = await generateSeriesConclusion(selectedSeries, items);
        setReport(result);
    } catch (e) {
        setReport('生成失败，请重试');
    } finally {
        setIsGenerating(false);
    }
  };
  
  const handleCompleteSeries = () => {
      if(!selectedSeries) return;
      if(window.confirm('确定要完结这个专题吗？完结后将归档。')) {
          const updated = { ...selectedSeries, status: 'completed' as const, completedAt: new Date().toISOString() };
          onUpdateSeries(updated);
          setSelectedSeries(updated);
      }
  }

  // --- Render List View ---
  if (viewState === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                我的专题 & 目标
             </h2>
             <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
             >
                 <Plus className="w-4 h-4" /> 新建专题
             </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {seriesList.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>还没有设定专题。</p>
                    <p className="text-sm">试着建立一个“阅读《三体》”或“学习 React”的目标吧。</p>
                </div>
            )}
            {seriesList.map(series => {
                const count = allItems.filter(i => i.seriesId === series.id).length;
                const lastUpdate = allItems
                    .filter(i => i.seriesId === series.id)
                    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                return (
                    <div 
                        key={series.id} 
                        onClick={() => openDetail(series)}
                        className={`bg-white p-5 rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-indigo-200 group
                            ${series.status === 'completed' ? 'opacity-70 border-slate-100 bg-slate-50' : 'border-slate-100'}
                        `}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className={`font-bold text-lg ${series.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                {series.title}
                            </h3>
                            {series.status === 'completed' ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                            )}
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2 h-10 mb-4">{series.description || '无描述'}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-50 pt-3">
                            <div className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {count} 篇笔记
                            </div>
                            {lastUpdate && (
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(lastUpdate.date).toLocaleDateString()} 更新
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-scale-in">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">开启新专题</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">专题名称</label>
                            <input 
                                autoFocus
                                type="text" 
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="例如：阅读《纳瓦尔宝典》"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">描述/目标</label>
                            <textarea 
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                                placeholder="你想在这个专题里达成什么目标？"
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg">取消</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">创建</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    );
  }

  // --- Render Detail View ---
  const seriesItems = allItems
    .filter(i => i.seriesId === selectedSeries?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="h-full flex flex-col">
        {/* Detail Header */}
        <div className="flex items-center gap-2 mb-6">
            <button onClick={() => setViewState('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    {selectedSeries?.title}
                    {selectedSeries?.status === 'completed' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">已完结</span>}
                </h2>
                <p className="text-sm text-slate-500">{selectedSeries?.description}</p>
            </div>
            <div className="flex gap-2">
                {selectedSeries?.status === 'active' && (
                    <>
                    <button 
                        onClick={() => onAddItemToSeries(selectedSeries.id)}
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> 记一笔
                    </button>
                    <button 
                        onClick={handleCompleteSeries}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium"
                    >
                        <CheckCircle className="w-4 h-4" /> 结案
                    </button>
                    </>
                )}
                <button 
                    onClick={() => {
                        if(window.confirm('确认删除专题？笔记将保留但不再关联。')) {
                            if(selectedSeries) onDeleteSeries(selectedSeries.id);
                            setViewState('list');
                        }
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6">
            {/* Timeline Left */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> 
                    足迹 ({seriesItems.length})
                </h3>
                {seriesItems.length === 0 && (
                    <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <p>还没有笔记，快去添加第一条吧！</p>
                    </div>
                )}
                <div className="space-y-4 relative pl-4 border-l-2 border-slate-100 ml-2">
                    {seriesItems.map(item => (
                        <div key={item.id} className="relative">
                            <div className="absolute -left-[21px] top-3 w-3 h-3 rounded-full bg-slate-200 border-2 border-white ring-1 ring-slate-100" />
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <p className="text-xs text-slate-400 mb-2">{new Date(item.date).toLocaleDateString()} · {item.durationMinutes} min</p>
                                {item.title && <h4 className="text-sm font-bold text-slate-800 mb-1">{item.title}</h4>}
                                <div 
                                    className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={renderMarkdown(item.content)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Review Right */}
            <div className="w-full md:w-[400px] bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col h-[500px] md:h-auto">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        AI 智能结案
                    </h3>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                    {!report && (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                            <p className="mb-4 text-sm">积累了 {seriesItems.length} 条笔记。<br/>让 AI 帮你整理成一篇完整的文章吧。</p>
                            <button 
                                onClick={handleGenerateReport}
                                disabled={seriesItems.length === 0 || isGenerating}
                                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-full font-medium flex items-center gap-2 shadow-lg shadow-purple-200 transition-all active:scale-95"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                生成总结文章
                            </button>
                        </div>
                    )}
                    
                    {report && (
                        <div className="prose prose-sm prose-slate max-w-none">
                            <div dangerouslySetInnerHTML={renderMarkdown(report)} />
                        </div>
                    )}
                </div>

                {report && (
                     <div className="p-3 border-t border-slate-100 flex justify-end">
                         <button 
                            onClick={() => {
                                const blob = new Blob([report], { type: 'text/markdown' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${selectedSeries?.title}_总结.md`;
                                a.click();
                            }}
                            className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600"
                         >
                             <Download className="w-3 h-3" /> 导出 MD
                         </button>
                     </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default SeriesView;
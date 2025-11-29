import React, { useState } from 'react';
import { WorkItem } from '../types';
import { generateWeeklyReport } from '../services/gemini';
import { FileText, Loader2, Copy, Check, Sparkles, Download } from 'lucide-react';

interface ReportGeneratorProps {
  items: WorkItem[];
  startDate: Date;
  endDate: Date;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ items, startDate, endDate }) => {
  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (items.length === 0) {
      setError("这段时间没有记录，先去写点什么吧！");
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      const result = await generateWeeklyReport(items, startDate, endDate);
      setReport(result);
    } catch (err) {
      setError("周报生成失败，请稍后再试。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Weekly_Review_${startDate.toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          周度复盘报告
        </h2>
        {report && (
            <div className="flex gap-2">
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-md transition-colors border border-slate-200 shadow-sm"
                    title="下载为 Markdown 文件"
                >
                    <Download className="w-4 h-4" />
                    导出
                </button>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors border border-slate-200 shadow-sm"
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? '已复制' : '复制'}
                </button>
            </div>
        )}
      </div>

      {!report && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-slate-800 font-medium mb-2">准备好回顾本周了吗？</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
            AI 助手将分析你本周的 {items.length} 条记录，为你生成一份包含知识沉淀、生活状态和成长的总结报告。
          </p>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            生成周度总结
          </button>
          {error && <p className="text-red-500 text-sm mt-4 bg-red-50 px-4 py-2 rounded-md">{error}</p>}
        </div>
      )}

      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-600 font-medium">正在分析你的记录...</p>
          <p className="text-slate-400 text-sm mt-1">梳理知识点 · 总结生活 · 规划未来</p>
        </div>
      )}

      {report && !isLoading && (
        <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="prose prose-sm prose-slate max-w-none bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-inner">
                <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">{report}</pre>
            </div>
        </div>
      )}
      
      {report && !isLoading && (
          <div className="mt-4 flex justify-end flex-shrink-0">
              <button 
                onClick={() => setReport('')}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                  清除结果
              </button>
          </div>
      )}
    </div>
  );
};

export default ReportGenerator;
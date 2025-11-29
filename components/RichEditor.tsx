import React, { useRef } from 'react';
import { Bold, Italic, List, Quote, Code, Heading1, ListOrdered } from 'lucide-react';

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

const RichEditor: React.FC<RichEditorProps> = ({ value, onChange, placeholder, className }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormat = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = `${before}${prefix}${selection}${suffix}${after}`;
    onChange(newText);

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div className={`border border-slate-200 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-500 transition-all ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-100 overflow-x-auto">
        <ToolButton onClick={() => insertFormat('**', '**')} icon={<Bold className="w-4 h-4" />} tooltip="加粗" />
        <ToolButton onClick={() => insertFormat('*', '*')} icon={<Italic className="w-4 h-4" />} tooltip="斜体" />
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <ToolButton onClick={() => insertFormat('# ')} icon={<Heading1 className="w-4 h-4" />} tooltip="标题" />
        <ToolButton onClick={() => insertFormat('- ')} icon={<List className="w-4 h-4" />} tooltip="列表" />
        <ToolButton onClick={() => insertFormat('1. ')} icon={<ListOrdered className="w-4 h-4" />} tooltip="有序列表" />
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <ToolButton onClick={() => insertFormat('> ')} icon={<Quote className="w-4 h-4" />} tooltip="引用" />
        <ToolButton onClick={() => insertFormat('`', '`')} icon={<Code className="w-4 h-4" />} tooltip="代码" />
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 min-h-[150px] outline-none text-slate-700 leading-relaxed resize-none bg-transparent"
        style={{ height: 'auto' }}
      />
    </div>
  );
};

const ToolButton: React.FC<{ onClick: () => void; icon: React.ReactNode; tooltip: string }> = ({ onClick, icon, tooltip }) => (
  <button
    type="button"
    onClick={onClick}
    title={tooltip}
    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded transition-colors"
  >
    {icon}
  </button>
);

export default RichEditor;
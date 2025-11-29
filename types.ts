export enum Category {
  Article = 'Article',
  Note = 'Note',
  Idea = 'Idea',
  Life = 'Life',
  Work = 'Work',
  Learning = 'Learning',
  Other = 'Other'
}

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.Article]: '📝 文章/写作',
  [Category.Note]: '📒 随手笔记',
  [Category.Idea]: '💡 灵感/想法',
  [Category.Life]: '🌿 生活/日常',
  [Category.Work]: '💼 工作/产出',
  [Category.Learning]: '📚 学习/阅读',
  [Category.Other]: '📁 其他归档',
};

export interface Series {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed';
  createdAt: string; // ISO string
  completedAt?: string; // ISO string
}

export interface WorkItem {
  id: string;
  title?: string; // Optional title
  content: string;
  category: Category;
  date: string; // ISO string
  durationMinutes: number;
  seriesId?: string; // Optional link to a series
}

export interface WeeklyStats {
  totalMinutes: number;
  categoryDistribution: { name: string; value: number }[];
  dailyDistribution: { name: string; minutes: number }[];
}
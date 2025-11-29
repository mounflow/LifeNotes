/// <reference types="vite/client" />
import { WorkItem, Series, CATEGORY_LABELS } from "../types";

// The client is now provided by a backend proxy. Front-end no longer accesses API keys.
// Helper to call the backend generate endpoint.
const callBackendGenerate = async (prompt: string, model: string = "gemini-2.5-flash") => {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error ?? "Backend generation failed");
  }
  const data = await response.json();
  return data.text as string;
};

// 1. 周报生成 (Weekly Report)
export const generateWeeklyReport = async (items: WorkItem[], startDate: Date, endDate: Date): Promise<string> => {

  const itemsText = items.map(i => {
    const titlePart = i.title ? `[标题: ${i.title}] ` : '';
    return `- [${i.category}] ${new Date(i.date).toLocaleDateString()}: ${titlePart}${i.content} (${i.durationMinutes} min)`;
  }).join('\n');

  const prompt = `
    你是一位专业的“个人知识管理与生活助手”。
    请根据以下用户在本周 (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}) 的记录，生成一份**中文周度复盘报告**。

    **原始记录:**
    ${itemsText}
    
    **结构要求 (Markdown):**
    1. **🌟 本周核心回顾**: 一句话总结本周状态。
    2. **📝 知识与产出**: 重点分析文章、笔记和学习类别的产出。如果有属于某个专题的内容，请特别指出进展。
    3. **💡 灵感与思考**: 提取有价值的想法。
    4. **🌿 生活状态**: 简述生活平衡情况。
    5. **📊 下周建议**: 简短的行动建议。
  `;

  try {
    const text = await callBackendGenerate(prompt);
    return text || "生成报告失败。";
  } catch (error) {
    if (import.meta.env.DEV) console.error("Gemini API Error:", error);
    throw new Error("无法连接到 AI 服务。");
  }
};

// 2. 专题结案/总结 (Series Conclusion)
export const generateSeriesConclusion = async (series: Series, items: WorkItem[]): Promise<string> => {

  // Sort items by date
  const sortedItems = [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const itemsText = sortedItems.map(i => {
    const titlePart = i.title ? `[标题: ${i.title}] ` : '';
    return `- ${new Date(i.date).toLocaleDateString()}: ${titlePart}${i.content}`;
  }).join('\n');

  const prompt = `
      用户完成了一个名为“${series.title}”的长期专题/目标。
      描述: ${series.description}
  
      以下是用户在执行这个过程中记录的所有笔记碎片。
      请你扮演一位**专业编辑**，将这些碎片化的笔记串联起来，整理成一篇**深度总结文章**或**读后感**。
  
      **笔记素材:**
      ${itemsText}
  
      **生成要求:**
      1. **标题**: 为这篇文章起一个有吸引力的标题。
      2. **连贯性**: 不要只是罗列笔记，要通过逻辑将它们串联成文。
      3. **深度**: 提炼用户在这些笔记中体现的核心观点和思想演变。
      4. **结构**: 包含引言、核心观点阐述（分点）、精彩摘录（如果有）和结语。
      5. **格式**: Markdown。
    `;

  try {
    const text = await callBackendGenerate(prompt);
    return text || "生成总结失败。";
  } catch (error) {
    if (import.meta.env.DEV) console.error("Gemini API Error:", error);
    throw new Error("无法连接到 AI 服务。");
  }
};

export const suggestCategory = async (content: string): Promise<string> => {

  const prompt = `
    请将以下内容归类为以下类别之一: Article (文章/写作), Note (笔记), Idea (灵感), Life (生活), Work (工作), Learning (学习), Other (其他)。
    内容: "${content}"
    只返回类别英文名称。
    `;

  try {
    const text = await callBackendGenerate(prompt);
    return text?.trim() || 'Other';
  } catch (e) {
    return 'Other';
  }
}
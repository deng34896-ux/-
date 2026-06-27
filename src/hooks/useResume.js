import { useState, useCallback } from 'react';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

function getStoredKey() {
  try { return localStorage.getItem('resume_tailor_api_key') || ''; }
  catch (e) { return ''; }
}
function setStoredKey(key) {
  try { localStorage.setItem('resume_tailor_api_key', key); }
  catch (e) { /* ignore */ }
}

const SYSTEM_PROMPT = `你是一位资深职业顾问和简历修改专家。

你的任务：分析简历原文和目标岗位描述，给出结构化修改建议。

核心原则：
- 不编造任何工作经历、项目或技能——只基于简历中已有的真实信息
- 可以调整措辞、强调符合岗位的经验、使用岗位关键词
- 可以调整叙述角度让经历更贴合目标岗位
- 诚实性优先于吸引力

返回纯 JSON（不要 markdown 包裹），结构如下：
{
  "summary": "重写后的职业概要",
  "experiences": [
    {
      "company": "公司名（保持原样）",
      "title": "职位（保持原样）",
      "dates": "时间（保持原样）",
      "highlights": ["重写后的亮点1", "重写后的亮点2"],
      "changes_summary": "简短的修改说明"
    }
  ],
  "skills": ["重新整理后的技能列表"],
  "skills_changes": "技能部分的修改说明",
  "overall_suggestions": "整体建议（1-3条）"
}`;

async function callClaude(resumeText, jobDescription, apiKey) {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `原始简历：\n---\n${resumeText}\n---\n\n目标岗位描述：\n---\n${jobDescription}\n---\n\n请根据以上岗位要求提出修改建议。`,
      }],
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `API 请求失败 (${resp.status})`);
  }
  const data = await resp.json();
  const raw = data.content[0].text.trim();
  return JSON.parse(raw);
}

export function useResume() {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeData, setResumeData] = useState({ personal_info: {}, summary: '', experiences: [], education: [], skills: [] });
  const [jobDescription, setJobDescription] = useState('');
  const [apiKey, setApiKey] = useState(getStoredKey);
  const [suggestions, setSuggestions] = useState(null);
  const [mergedData, setMergedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const saveApiKey = useCallback((key) => { setApiKey(key); setStoredKey(key); }, []);

  const uploadResume = useCallback(async (file) => {
    setUploading(true);
    setError('');
    try {
      const buffer = await file.arrayBuffer();
      let text = '';
      const ext = file.name.split('.').pop().toLowerCase();

      if (ext === 'docx') {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        text = result.value;
      } else if (ext === 'pdf') {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          pages.push(content.items.map(it => it.str).join(' '));
        }
        text = pages.join('\n\n');
      } else {
        throw new Error(`不支持的文件格式 .${ext}，请上传 .docx 或 .pdf`);
      }

      if (!text.trim()) throw new Error('未能从文件中提取到文本内容');
      setResumeFile(file);
      setResumeText(text);
      setResumeData({ personal_info: {}, summary: text, experiences: [], education: [], skills: [] });
      setSuggestions(null);
      setMergedData(null);
      return { text };
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setUploading(false);
    }
  }, []);

  const tailorResume = useCallback(async () => {
    if (!resumeText || !jobDescription || !apiKey) return;
    setLoading(true);
    setError('');
    try {
      saveApiKey(apiKey);
      const suggestions = await callClaude(resumeText, jobDescription, apiKey);
      setSuggestions(suggestions);
      setMergedData(merge(resumeData, suggestions));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [resumeText, jobDescription, apiKey, resumeData, saveApiKey]);

  const acceptSuggestion = useCallback(() => {
    if (mergedData) { setResumeData(mergedData); setSuggestions(null); setMergedData(null); }
  }, [mergedData]);

  const rejectSuggestion = useCallback(() => { setSuggestions(null); setMergedData(null); }, []);

  const reset = useCallback(() => {
    setResumeFile(null); setResumeText('');
    setResumeData({ personal_info: {}, summary: '', experiences: [], education: [], skills: [] });
    setJobDescription(''); setSuggestions(null); setMergedData(null); setError('');
  }, []);

  const exportResume = useCallback(async (format) => {
    const data = mergedData || resumeData;
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import('docx');
      const children = [];

      // Personal info header
      const personal = data.personal_info || {};
      const name = personal.name || '姓名';
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: name, bold: true, size: 44, color: '1E3A5F', font: 'Calibri' })] }));

      const contacts = [personal.email, personal.phone, personal.location].filter(Boolean);
      if (contacts.length) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: contacts.join('  |  '), size: 20, color: '64748B', font: 'Calibri' })] }));

      function sectionHeading(text) {
        children.push(new Paragraph({ spacing: { before: 240, after: 80 }, border: { bottom: { color: 'CBD5E1', space: 1, style: BorderStyle.SINGLE, size: 4 } }, children: [new TextRun({ text, bold: true, size: 26, color: '1E3A5F', font: 'Calibri' })] }));
      }

      // Summary
      const summary = data.summary || '';
      if (summary) { sectionHeading('职业概要'); children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: summary, size: 22, font: 'Calibri' })] })); }

      // Experiences
      const experiences = data.experiences || [];
      if (experiences.length) {
        sectionHeading('工作经历');
        for (const exp of experiences) {
          children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${exp.company || ''} — ${exp.title || ''}`, bold: true, size: 22, font: 'Calibri' }), new TextRun({ text: `    ${exp.dates || ''}`, size: 20, color: '64748B', font: 'Calibri' })] }));
          const highlights = Array.isArray(exp.highlights) ? exp.highlights : [];
          for (const h of highlights) children.push(new Paragraph({ spacing: { after: 20 }, indent: { left: 360 }, bullet: { level: 0 }, children: [new TextRun({ text: h, size: 20, font: 'Calibri' })] }));
        }
      }

      // Education
      const education = data.education || [];
      if (education.length) {
        sectionHeading('教育背景');
        for (const edu of education) children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${edu.school || ''} — ${edu.degree || ''} ${edu.major || ''}`, bold: true, size: 22, font: 'Calibri' }), new TextRun({ text: `    ${edu.dates || ''}`, size: 20, color: '64748B', font: 'Calibri' })] }));
      }

      // Skills
      const skills = data.skills || [];
      if (skills.length) { sectionHeading('专业技能'); children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: (Array.isArray(skills) ? skills : [skills]).join('、'), size: 22, font: 'Calibri' })] })); }

      const doc = new Document({ sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1418, right: 1418 } } }, children }] });

      if (format === 'docx') {
        const blob = await Packer.toBlob(doc);
        downloadBlob(blob, 'tailored_resume.docx');
      } else if (format === 'pdf') {
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tailored_resume.docx';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      throw new Error('导出失败: ' + e.message);
    }
  }, [resumeData, mergedData]);

  return {
    resumeFile, resumeText, resumeData, jobDescription, apiKey,
    suggestions, mergedData, loading, error, uploading,
    setJobDescription, saveApiKey, uploadResume, tailorResume,
    acceptSuggestion, rejectSuggestion, reset, exportResume,
  };
}

function merge(original, suggestions) {
  return {
    personal_info: original.personal_info || {},
    summary: suggestions.summary || original.summary || '',
    experiences: suggestions.experiences || original.experiences || [],
    education: original.education || [],
    skills: suggestions.skills || original.skills || [],
  };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

import { useState, useCallback } from 'react';

function getStoredKey() {
  try { return localStorage.getItem('resume_tailor_api_key') || ''; }
  catch (e) { return ''; }
}
function setStoredKey(key) {
  try { localStorage.setItem('resume_tailor_api_key', key); }
  catch (e) {}
}
function getStoredProvider() {
  try { return localStorage.getItem('resume_tailor_provider') || 'deepseek'; }
  catch (e) { return 'deepseek'; }
}
function setStoredProvider(pid) {
  try { localStorage.setItem('resume_tailor_provider', pid); }
  catch (e) {}
}

const SYSTEM_PROMPT = `你是一位资深职业顾问和简历修改专家。

分析简历原文和目标岗位描述，给出结构化修改建议。

核心原则：
- 不编造工作经历、项目或技能，只基于已有的真实信息
- 调整措辞、强调符合岗位的经验、使用岗位关键词
- 调整叙述角度让经历更贴合目标岗位
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
  "skills_changes": "技能修改说明",
  "overall_suggestions": "整体建议（1-3条）"
}`;

const USER_MSG = (resumeText, jobDescription) => `原始简历：\n---\n${resumeText}\n---\n\n目标岗位描述：\n---\n${jobDescription}\n---\n\n请提出修改建议。`;

async function callAI(provider, resumeText, jobDescription, apiKey) {
  if (provider === 'anthropic') {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: USER_MSG(resumeText, jobDescription) }] }),
    });
    if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error?.message || `Anthropic 错误 ${resp.status}`); }
    return JSON.parse((await resp.json()).content[0].text.trim());
  }

  if (provider === 'deepseek') {
    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'deepseek-chat', max_tokens: 4096, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: USER_MSG(resumeText, jobDescription) }] }),
    });
    if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error?.message || `DeepSeek 错误 ${resp.status}`); }
    return JSON.parse((await resp.json()).choices[0].message.content.trim());
  }

  if (provider === 'openai') {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o', max_tokens: 4096, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: USER_MSG(resumeText, jobDescription) }] }),
    });
    if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error?.message || `OpenAI 错误 ${resp.status}`); }
    return JSON.parse((await resp.json()).choices[0].message.content.trim());
  }

  throw new Error('不支持的 AI 提供商');
}

export function useResume() {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeData, setResumeData] = useState({ personal_info: {}, summary: '', experiences: [], education: [], skills: [] });
  const [jobDescription, setJobDescription] = useState('');
  const [apiKey, setApiKey] = useState(getStoredKey);
  const [provider, setProvider] = useState(getStoredProvider);
  const [suggestions, setSuggestions] = useState(null);
  const [mergedData, setMergedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const saveApiKey = useCallback((key) => { setApiKey(key); setStoredKey(key); }, []);
  const saveProvider = useCallback((pid) => { setProvider(pid); setStoredProvider(pid); }, []);

  const uploadResume = useCallback(async (file) => {
    setUploading(true); setError('');
    try {
      const buf = await file.arrayBuffer();
      let text = '';
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'docx') { text = (await (await import('mammoth')).extractRawText({ arrayBuffer: buf })).value; }
      else if (ext === 'pdf') {
        const lib = await import('pdfjs-dist');
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
        const pdf = await lib.getDocument({ data: buf }).promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) { const c = await (await pdf.getPage(i)).getTextContent(); pages.push(c.items.map(it => it.str).join(' ')); }
        text = pages.join('\n\n');
      } else throw new Error(`不支持 .${ext}，请上传 .docx 或 .pdf`);
      if (!text.trim()) throw new Error('未能从文件中提取到文本');
      setResumeFile(file); setResumeText(text);
      setResumeData({ personal_info: {}, summary: text, experiences: [], education: [], skills: [] });
      setSuggestions(null); setMergedData(null);
      return { text };
    } catch (e) { setError(e.message); throw e; }
    finally { setUploading(false); }
  }, []);

  const tailorResume = useCallback(async () => {
    if (!resumeText || !jobDescription || !apiKey) return;
    setLoading(true); setError('');
    try {
      saveApiKey(apiKey); saveProvider(provider);
      const s = await callAI(provider, resumeText, jobDescription, apiKey);
      setSuggestions(s); setMergedData(merge(resumeData, s));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [resumeText, jobDescription, apiKey, provider, resumeData, saveApiKey, saveProvider]);

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
      const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = await import('docx');
      const ch = [];
      const p = data.personal_info || {};
      const name = p.name || '姓名';
      ch.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: name, bold: true, size: 44, color: '1E3A5F', font: 'Calibri' })] }));
      const ct = [p.email, p.phone, p.location].filter(Boolean);
      if (ct.length) ch.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: ct.join('  |  '), size: 20, color: '64748B', font: 'Calibri' })] }));
      const sh = (t) => ch.push(new Paragraph({ spacing: { before: 240, after: 80 }, border: { bottom: { color: 'CBD5E1', space: 1, style: BorderStyle.SINGLE, size: 4 } }, children: [new TextRun({ text: t, bold: true, size: 26, color: '1E3A5F', font: 'Calibri' })] }));
      const s = data.summary || '';
      if (s) { sh('职业概要'); ch.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: s, size: 22, font: 'Calibri' })] })); }
      const exps = data.experiences || [];
      if (exps.length) { sh('工作经历'); for (const e of exps) { ch.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${e.company || ''} — ${e.title || ''}`, bold: true, size: 22, font: 'Calibri' }), new TextRun({ text: `    ${e.dates || ''}`, size: 20, color: '64748B', font: 'Calibri' })] })); for (const h of (Array.isArray(e.highlights) ? e.highlights : [])) ch.push(new Paragraph({ spacing: { after: 20 }, indent: { left: 360 }, bullet: { level: 0 }, children: [new TextRun({ text: h, size: 20, font: 'Calibri' })] })); } }
      const edu = data.education || [];
      if (edu.length) { sh('教育背景'); for (const e of edu) ch.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${e.school || ''} — ${e.degree || ''} ${e.major || ''}`, bold: true, size: 22, font: 'Calibri' }), new TextRun({ text: `    ${e.dates || ''}`, size: 20, color: '64748B', font: 'Calibri' })] })); }
      const sk = data.skills || [];
      if (sk.length) { sh('专业技能'); ch.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: (Array.isArray(sk) ? sk : [sk]).join('、'), size: 22, font: 'Calibri' })] })); }
      const doc = new Document({ sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1418, right: 1418 } } }, children: ch }] });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'tailored_resume.docx'; a.click(); URL.revokeObjectURL(url);
    } catch (e) { throw new Error('导出失败: ' + e.message); }
  }, [resumeData, mergedData]);

  return {
    resumeFile, resumeText, resumeData, jobDescription, apiKey, provider,
    suggestions, mergedData, loading, error, uploading,
    setJobDescription, saveApiKey, saveProvider, uploadResume, tailorResume,
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

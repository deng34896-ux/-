import { useState, useCallback } from 'react';

function gk() { try { return localStorage.getItem('rt_key') || ''; } catch { return ''; } }
function sk(k) { try { localStorage.setItem('rt_key', k); } catch {} }
function gp() { try { return localStorage.getItem('rt_provider') || 'deepseek'; } catch { return 'deepseek'; } }
function sp(p) { try { localStorage.setItem('rt_provider', p); } catch {} }

const PARSE_PROMPT = `你是简历解析专家。将中文简历原文解析为结构化 JSON。

重要：保留所有原始个人信息（姓名、电话、邮箱、地址、照片描述等），不要删改。

返回纯 JSON：
{
  "personal_info": { "name": "姓名", "phone": "电话", "email": "邮箱", "location": "城市" },
  "summary": "个人简介/求职意向，没有则为空字符串",
  "experiences": [{ "company": "公司", "title": "职位", "dates": "起止时间", "highlights": ["工作内容1", "工作内容2"] }],
  "education": [{ "school": "学校", "degree": "学历", "major": "专业", "dates": "时间" }],
  "skills": ["技能1", "技能2"]
}`;

const TAILOR_PROMPT = `你是资深简历优化顾问。根据岗位描述优化用户简历。

原则：
- 保留所有原始个人信息（姓名、电话、邮箱、地址）不变
- 不编造经历、项目或技能，只重写已有内容
- 可调整措辞和侧重点来匹配岗位
- 诚实优先

返回纯 JSON：
{
  "experiences": [{ "company": "公司(不变)", "title": "职位(不变)", "dates": "时间(不变)", "highlights": ["优化后的亮点"], "changes_summary": "修改说明" }],
  "skills": ["优化排序后的技能"],
  "skills_changes": "技能调整说明",
  "overall_suggestions": "1-3条建议"
}`;

function userMsg(resumeText, jobDescription, resumeData) {
  return `简历原文：\n${resumeText}\n\n结构化数据：\n${JSON.stringify(resumeData, null, 2)}\n\n岗位描述：\n${jobDescription}\n\n请优化。`;
}

async function callAI(provider, messages, apiKey, sysPrompt) {
  const raw = async (text) => {
    let t = text.trim();
    t = t.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(t);
  };
  if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: sysPrompt, messages: [{ role: 'user', content: messages.map(m => m.content).join('\n\n') }] }),
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || `错误 ${r.status}`); }
    return raw((await r.json()).content[0].text);
  }
  const url = provider === 'deepseek' ? 'https://api.deepseek.com/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  const model = provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o';
  const r = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, max_tokens: 4096, messages: [{ role: 'system', content: sysPrompt }, ...messages] }),
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || `错误 ${r.status}`); }
  return raw((await r.json()).choices[0].message.content);
}

export function useResume() {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeData, setResumeData] = useState({ personal_info: {}, summary: '', experiences: [], education: [], skills: [] });
  const [jobDescription, setJobDescription] = useState('');
  const [apiKey, setApiKey] = useState(gk);
  const [provider, setProvider] = useState(gp);
  const [suggestions, setSuggestions] = useState(null);
  const [mergedData, setMergedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);

  const saveApiKey = useCallback((key) => { setApiKey(key); sk(key); }, []);
  const saveProvider = useCallback((pid) => { setProvider(pid); sp(pid); }, []);

  const uploadResume = useCallback(async (file) => {
    setUploading(true); setError('');
    try {
      const buf = await file.arrayBuffer(); let text = '';
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
      if (!text.trim()) throw new Error('未提取到文本');
      setResumeFile(file); setResumeText(text);
      const k = apiKey || gk(); const p = provider || gp();
      if (k) {
        setParsing(true);
        try {
          const s = await callAI(p, [{ role: 'user', content: `简历原文：\n---\n${text}\n---\n\n请解析为结构化JSON。` }], k, PARSE_PROMPT);
          setResumeData({ personal_info: s.personal_info || {}, summary: s.summary || '', experiences: s.experiences || [], education: s.education || [], skills: s.skills || [] });
        } catch { setResumeData({ personal_info: {}, summary: '', experiences: [], education: [], skills: [] }); }
        finally { setParsing(false); }
      } else { setResumeData({ personal_info: {}, summary: '', experiences: [], education: [], skills: [] }); }
      setSuggestions(null); setMergedData(null);
      return { text };
    } catch (e) { setError(e.message); throw e; }
    finally { setUploading(false); }
  }, [apiKey, provider]);

  const updateResumeData = useCallback((updater) => {
    setResumeData(prev => typeof updater === 'function' ? updater(prev) : updater);
  }, []);

  const updateMergedData = useCallback((updater) => {
    setMergedData(prev => prev ? (typeof updater === 'function' ? updater(prev) : updater) : prev);
  }, []);

  const tailorResume = useCallback(async () => {
    if (!resumeText || !jobDescription || !apiKey) return;
    setLoading(true); setError('');
    try {
      saveApiKey(apiKey); saveProvider(provider);
      const s = await callAI(provider, [{ role: 'user', content: userMsg(resumeText, jobDescription, resumeData) }], apiKey, TAILOR_PROMPT);
      setSuggestions(s);
      setMergedData({
        personal_info: { ...resumeData.personal_info },
        summary: resumeData.summary,
        experiences: s.experiences || resumeData.experiences,
        education: [...(resumeData.education || [])],
        skills: s.skills || resumeData.skills,
      });
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

  const exportResume = useCallback(async () => {
    const data = mergedData || resumeData;
    try {
      const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, convertInchesToTwip } = await import('docx');
      const ch = [];
      const pi = data.personal_info || {};

      // Header: Name + Contact
      ch.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: pi.name || '姓名', bold: true, size: 44, font: { name: 'SimHei', eastAsia: 'SimHei' } })] }));

      const contacts = [pi.phone, pi.email, pi.location].filter(Boolean);
      if (contacts.length) {
        ch.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: contacts.join('  |  '), size: 20, color: '555555', font: { name: 'SimSun', eastAsia: 'SimSun' } })] }));
      }

      function secHead(text, before) {
        ch.push(new Paragraph({ spacing: { before: before || 200, after: 100 }, border: { bottom: { color: '333333', space: 2, style: BorderStyle.SINGLE, size: 6 } }, children: [new TextRun({ text, bold: true, size: 26, font: { name: 'SimHei', eastAsia: 'SimHei' } })] }));
      }

      // Summary: only if has content
      const summary = data.summary || '';
      if (summary && summary.length > 5) {
        secHead('求职意向', 80);
        ch.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: summary, size: 21, font: { name: 'SimSun', eastAsia: 'SimSun' } })] }));
      }

      // Experiences
      const exps = data.experiences || [];
      if (exps.length) {
        secHead('工作经历');
        for (const e of exps) {
          ch.push(new Paragraph({ spacing: { before: 100, after: 20 }, children: [new TextRun({ text: `${e.company || ''}  |  ${e.title || ''}`, bold: true, size: 22, font: { name: 'SimHei', eastAsia: 'SimHei' } }), new TextRun({ text: `    ${e.dates || ''}`, size: 18, color: '888888', font: { name: 'SimSun', eastAsia: 'SimSun' } })] }));
          const hls = Array.isArray(e.highlights) ? e.highlights : [];
          for (const h of hls) {
            ch.push(new Paragraph({ spacing: { after: 20 }, indent: { left: 360 }, bullet: { level: 0 }, children: [new TextRun({ text: h, size: 20, font: { name: 'SimSun', eastAsia: 'SimSun' } })] }));
          }
        }
      }

      // Education
      const edu = data.education || [];
      if (edu.length) {
        secHead('教育背景');
        for (const e of edu) {
          ch.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${e.school || ''}  |  ${e.degree || ''} ${e.major || ''}`, bold: true, size: 22, font: { name: 'SimHei', eastAsia: 'SimHei' } }), new TextRun({ text: `    ${e.dates || ''}`, size: 18, color: '888888', font: { name: 'SimSun', eastAsia: 'SimSun' } })] }));
        }
      }

      // Skills
      const sk = data.skills || [];
      if (sk.length) {
        secHead('专业技能');
        ch.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: (Array.isArray(sk) ? sk : [sk]).join('  ·  '), size: 21, font: { name: 'SimSun', eastAsia: 'SimSun' } })] }));
      }

      const doc = new Document({
        sections: [{
          properties: { page: { margin: { top: convertInchesToTwip(0.8), bottom: convertInchesToTwip(0.7), left: convertInchesToTwip(1.0), right: convertInchesToTwip(1.0) } } },
          children: ch,
        }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'optimized_resume.docx'; a.click(); URL.revokeObjectURL(url);
    } catch (e) { throw new Error('导出失败: ' + e.message); }
  }, [resumeData, mergedData]);

  return {
    resumeFile, resumeText, resumeData, jobDescription, apiKey, provider,
    suggestions, mergedData, loading, error, uploading, parsing,
    setJobDescription, saveApiKey, saveProvider, uploadResume, tailorResume,
    updateResumeData, updateMergedData, acceptSuggestion, rejectSuggestion, reset, exportResume,
  };
}

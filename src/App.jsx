import { useState } from 'react';
import { useResume } from './hooks/useResume';
import UploadZone from './components/UploadZone';
import JobInput from './components/JobInput';
import ApiKeyInput from './components/ApiKeyInput';
import SuggestionsPanel from './components/SuggestionsPanel';
import ResumePreview from './components/ResumePreview';
import './App.css';

function App() {
  const {
    resumeFile, resumeText, resumeData, jobDescription, apiKey,
    suggestions, mergedData, loading, error, uploading,
    setJobDescription, saveApiKey, uploadResume, tailorResume,
    acceptSuggestion, rejectSuggestion, reset, exportResume,
  } = useResume();

  const [showTool, setShowTool] = useState(false);

  const handleTailor = () => {
    if (!apiKey.trim()) return;
    saveApiKey(apiKey);
    tailorResume();
  };

  const displayData = mergedData || resumeData;
  const hasResume = !!resumeText;

  return (
    <div className="app">
      {/* ── Navigation ── */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="#" className="nav-brand">ResumeTailor</a>
          <div className="nav-links">
            <a href="#features">功能亮点</a>
            <a href="#how-it-works">使用流程</a>
            <button className="nav-cta" onClick={() => { setShowTool(true); setTimeout(() => document.getElementById('tool').scrollIntoView({ behavior: 'smooth' }), 100); }}>开始使用</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-badge">🚀 求职加速器</div>
          <h1 className="hero-title">
            让你的简历<span className="hero-highlight">精准命中</span><br/>每一个目标岗位
          </h1>
          <p className="hero-subtitle">
            上传简历，粘贴 JD，AI 自动分析岗位要求并重写简历内容。<br/>
            告别海投石沉大海，让每一份投递都有的放矢。
          </p>
          <div className="hero-actions">
            <button className="hero-btn-primary" onClick={() => { setShowTool(true); setTimeout(() => document.getElementById('tool').scrollIntoView({ behavior: 'smooth' }), 100); }}>
              免费开始优化
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <a href="#how-it-works" className="hero-btn-secondary">了解流程</a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><strong>87%</strong><span>面试邀约率提升</span></div>
            <div className="hero-stat"><strong>3min</strong><span>完成一份简历优化</span></div>
            <div className="hero-stat"><strong>AI</strong><span>驱动精准匹配</span></div>
          </div>
        </div>
      </header>

      {/* ── Features ── */}
      <section id="features" className="features">
        <div className="section-inner">
          <div className="section-eyebrow">核心能力</div>
          <h2 className="section-heading">为什么选择 ResumeTailor</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <h3>智能关键词匹配</h3>
              <p>自动识别 JD 中的核心技能和关键词，将它们有机融入你的简历，让 ATS 筛选系统和 HR 都能一眼看到你。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <h3>快速高效</h3>
              <p>从上传到获得优化建议，整个过程不超过 3 分钟。不需要反复手动修改，AI 一次性给出完整的改写方案。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3>保持真实不虚构</h3>
              <p>AI 只基于你已有的经验进行重写和强调，绝不编造经历。优化的是表达方式，不是内容本身。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              </div>
              <h3>多格式支持</h3>
              <p>上传 DOCX 或 PDF 格式的简历，优化完成后可导出为 Word 或 PDF。与你的求职流程无缝衔接。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3>隐私安全</h3>
              <p>你的 API Key 和简历内容仅存储在浏览器本地，不会上传到任何第三方服务器。你的数据你做主。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h3>支持多种岗位</h3>
              <p>无论是技术、产品、运营、市场还是金融岗位，AI 都能根据行业特点给出针对性的简历优化建议。</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="how-it-works">
        <div className="section-inner">
          <div className="section-eyebrow">三步完成</div>
          <h2 className="section-heading">从简历到投递，只需三步</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">01</div>
              <div className="step-content">
                <h3>上传简历 + 粘贴 JD</h3>
                <p>将你的简历文件（Word 或 PDF）拖拽上传，然后粘贴目标岗位的职位描述。职位描述越详细，AI 的建议越精准。</p>
              </div>
            </div>
            <div className="step-connector">
              <svg width="24" height="60" viewBox="0 0 24 60" fill="none"><path d="M12 0v48" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4"/><polyline points="4 50 12 58 20 50" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
            </div>
            <div className="step">
              <div className="step-number">02</div>
              <div className="step-content">
                <h3>AI 分析并生成优化建议</h3>
                <p>Claude AI 分析你的简历与岗位要求的匹配度，重写职业概要、优化经历描述、调整技能排序，并附上每项修改的说明。</p>
              </div>
            </div>
            <div className="step-connector">
              <svg width="24" height="60" viewBox="0 0 24 60" fill="none"><path d="M12 0v48" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4"/><polyline points="4 50 12 58 20 50" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
            </div>
            <div className="step">
              <div className="step-number">03</div>
              <div className="step-content">
                <h3>确认修改 & 导出</h3>
                <p>在右侧预览优化后的简历，确认满意后一键接受。导出为 Word 或 PDF 格式，直接用于投递。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tool ── */}
      <section id="tool" className="tool-section">
        <div className="section-inner">
          <div className="section-eyebrow">开始优化</div>
          <h2 className="section-heading">立即定制你的简历</h2>
          {!showTool ? (
            <div className="tool-gate">
              <p>输入你的 API Key 即可开始，Key 仅存储在本地浏览器中。</p>
              <div className="tool-gate-key">
                <ApiKeyInput value={apiKey} onChange={saveApiKey} />
              </div>
              <button className="tool-gate-btn" disabled={!apiKey.trim()} onClick={() => setShowTool(true)}>
                进入工作台
              </button>
            </div>
          ) : (
            <div className="tool-workspace">
              <aside className="app-sidebar">
                <UploadZone onUpload={uploadResume} uploading={uploading} hasFile={!!resumeFile} fileName={resumeFile?.name} />
                {hasResume && (
                  <>
                    <JobInput value={jobDescription} onChange={setJobDescription} disabled={loading} />
                    <div className="tool-key-inline">
                      <ApiKeyInput value={apiKey} onChange={saveApiKey} />
                    </div>
                    {error && (
                      <div className="error-msg">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        {error}
                      </div>
                    )}
                    <button className="btn-tailor" disabled={!jobDescription.trim() || !apiKey.trim() || loading} onClick={handleTailor}>
                      {loading ? (<><span className="spinner-small" /> 分析中...</>) : '生成修改建议'}
                    </button>
                    <SuggestionsPanel suggestions={suggestions} onAccept={acceptSuggestion} onReject={rejectSuggestion} />
                  </>
                )}
              </aside>
              <section className="app-preview">
                {hasResume ? (
                  <ResumePreview data={displayData} isMerged={!!mergedData} onExport={exportResume} />
                ) : (
                  <div className="preview-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.3">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <p>上传简历文件即可在此预览</p>
                    <span>支持 .docx 和 .pdf 格式</span>
                  </div>
                )}
              </section>
              {hasResume && (
                <button className="btn-reset-fixed" onClick={() => { reset(); setShowTool(false); }} title="重新开始">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="faq">
        <div className="section-inner">
          <div className="section-eyebrow">常见问题</div>
          <h2 className="section-heading">你可能想了解</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>需要自己提供 API Key 吗？</h3>
              <p>是的，需要你提供自己的 Anthropic API Key。Key 仅在浏览器本地存储和使用，不会上传到任何第三方服务器。你可以在 Anthropic Console 中免费申请。</p>
            </div>
            <div className="faq-item">
              <h3>AI 会编造不存在的经历吗？</h3>
              <p>不会。我们的 AI 被明确要求只基于你已有的真实经历进行重写和强调，绝不编造任何工作经历、项目或技能。</p>
            </div>
            <div className="faq-item">
              <h3>支持哪些文件格式？</h3>
              <p>上传支持 .docx（Word）和 .pdf 格式。导出同样支持这两种格式，方便你直接用于求职投递。</p>
            </div>
            <div className="faq-item">
              <h3>适合哪些岗位类型？</h3>
              <p>从技术开发到市场营销，从产品管理到金融分析——ResumeTailor 适用于几乎所有行业的岗位。AI 会根据 JD 中的行业特征给出针对性建议。</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <a href="#" className="nav-brand">ResumeTailor</a>
            <p>让每一次投递都更有把握</p>
          </div>
          <div className="footer-links">
            <a href="#features">功能</a>
            <a href="#how-it-works">流程</a>
            <a href="#tool">开始使用</a>
          </div>
          <div className="footer-copy">
            <p>&copy; 2026 ResumeTailor. 基于 Claude API 构建。</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

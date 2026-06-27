import './ResumePreview.css';

const EMPTY = { personal_info: {}, summary: '', experiences: [], education: [], skills: [] };

export default function ResumePreview({ data, isMerged, onExport }) {
  const d = data || EMPTY;

  return (
    <div className="resume-preview">
      <div className="preview-toolbar">
        <h3 className="preview-title">{isMerged ? 'AI 优化预览' : '简历预览'}</h3>
        <div className="preview-actions">
          <button className="btn-preview" onClick={() => onExport('docx')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            DOCX
          </button>
          <button className="btn-preview" onClick={() => onExport('pdf')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            PDF
          </button>
        </div>
      </div>

      <div className="preview-paper">
        <div className="paper-header">
          <h1 className="paper-name">{d.personal_info?.name || '姓名'}</h1>
          <p className="paper-contact">
            {[d.personal_info?.email, d.personal_info?.phone, d.personal_info?.location].filter(Boolean).join('  |  ') || 'email | 电话 | 城市'}
          </p>
        </div>

        <Section heading="职业概要">
          <p className="paper-summary">{d.summary || '暂无概要内容'}</p>
        </Section>

        <Section heading="工作经历">
          {(d.experiences || []).map((exp, i) => (
            <div className="paper-block" key={i}>
              <div className="paper-block-head">
                <strong>{exp.company} - {exp.title}</strong>
                <span className="paper-dates">{exp.dates}</span>
              </div>
              <ul className="paper-highlights">
                {(exp.highlights || []).map((h, j) => <li key={j}>{h}</li>)}
              </ul>
            </div>
          ))}
          {(!d.experiences || d.experiences.length === 0) && <p className="paper-empty">暂无工作经历</p>}
        </Section>

        <Section heading="教育背景">
          {(d.education || []).map((edu, i) => (
            <div className="paper-block" key={i}>
              <div className="paper-block-head">
                <strong>{edu.school} - {edu.degree} {edu.major}</strong>
                <span className="paper-dates">{edu.dates}</span>
              </div>
            </div>
          ))}
          {(!d.education || d.education.length === 0) && <p className="paper-empty">暂无教育背景</p>}
        </Section>

        <Section heading="专业技能">
          <div className="paper-skills">
            {(d.skills || []).map((s, i) => <span key={i} className="paper-skill-tag">{s}</span>)}
            {(!d.skills || d.skills.length === 0) && <span className="paper-empty">暂无技能信息</span>}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ heading, children }) {
  return (
    <div className="paper-section">
      <h2 className="paper-section-heading">{heading}</h2>
      {children}
    </div>
  );
}

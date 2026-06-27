import { useState } from 'react';
import './ResumePreview.css';

const EMPTY = { personal_info: {}, summary: '', experiences: [], education: [], skills: [] };

export default function ResumePreview({ data, isMerged, onExport, onUpdate, onUpdateMerged }) {
  const d = data || EMPTY;
  const canEdit = !isMerged;
  const updater = isMerged ? onUpdateMerged : onUpdate;

  function updateField(field, value) {
    if (!updater) return;
    updater(prev => ({ ...prev, [field]: value }));
  }

  function updatePI(field, value) {
    if (!updater) return;
    updater(prev => ({ ...prev, personal_info: { ...prev.personal_info, [field]: value } }));
  }

  function updateExp(idx, field, value) {
    if (!updater) return;
    updater(prev => {
      const exps = [...(prev.experiences || [])];
      if (exps[idx]) exps[idx] = { ...exps[idx], [field]: value };
      return { ...prev, experiences: exps };
    });
  }

  function updateExpHighlight(idx, hj, value) {
    if (!updater) return;
    updater(prev => {
      const exps = [...(prev.experiences || [])];
      if (exps[idx]) {
        const hls = [...(exps[idx].highlights || [])];
        hls[hj] = value;
        exps[idx] = { ...exps[idx], highlights: hls };
      }
      return { ...prev, experiences: exps };
    });
  }

  function updateEdu(idx, field, value) {
    if (!updater) return;
    updater(prev => {
      const edu = [...(prev.education || [])];
      if (edu[idx]) edu[idx] = { ...edu[idx], [field]: value };
      return { ...prev, education: edu };
    });
  }

  function updateSkills(text) {
    if (!updater) return;
    const arr = text.split(/[,，、·\s]+/).filter(Boolean);
    updater(prev => ({ ...prev, skills: arr }));
  }

  const pi = d.personal_info || {};

  return (
    <div className="resume-preview">
      <div className="preview-toolbar">
        <h3 className="preview-title">{isMerged ? 'AI 优化预览（接受后可在左侧编辑）' : '简历预览（点击文字可编辑）'}</h3>
        <div className="preview-actions">
          <button className="btn-preview" onClick={() => onExport("docx")}>⬇ 导出 DOCX</button>
        </div>
      </div>

      <div className="preview-paper">
        {/* Header */}
        <div className="paper-header">
          {canEdit ? (
            <input className="paper-name editable" value={pi.name || ''} onChange={e => updatePI('name', e.target.value)} placeholder="姓名" />
          ) : (
            <h1 className="paper-name">{pi.name || '姓名'}</h1>
          )}
          {canEdit ? (
            <div className="paper-contact-row">
              <input className="paper-contact-edit" value={pi.phone || ''} onChange={e => updatePI('phone', e.target.value)} placeholder="电话" />
              <input className="paper-contact-edit" value={pi.email || ''} onChange={e => updatePI('email', e.target.value)} placeholder="邮箱" />
              <input className="paper-contact-edit" value={pi.location || ''} onChange={e => updatePI('location', e.target.value)} placeholder="城市" />
            </div>
          ) : (
            <p className="paper-contact">
              {[pi.phone, pi.email, pi.location].filter(Boolean).join('  |  ') || '联系方式'}
            </p>
          )}
        </div>

        {/* Summary - only if has content */}
        {(d.summary && d.summary.length > 3) && (
          <Section heading="求职意向">
            {canEdit ? (
              <textarea className="paper-summary editable-textarea" value={d.summary} onChange={e => updateField('summary', e.target.value)} rows={2} />
            ) : (
              <p className="paper-summary">{d.summary}</p>
            )}
          </Section>
        )}

        {/* Experiences */}
        <Section heading="工作经历">
          {(d.experiences || []).map((exp, i) => (
            <div className="paper-block" key={i}>
              <div className="paper-block-head">
                {canEdit ? (
                  <div className="exp-edit-row">
                    <input className="paper-inline-edit" value={exp.company || ''} onChange={e => updateExp(i, 'company', e.target.value)} placeholder="公司" />
                    <span className="edit-sep">|</span>
                    <input className="paper-inline-edit" value={exp.title || ''} onChange={e => updateExp(i, 'title', e.target.value)} placeholder="职位" />
                    <input className="paper-inline-edit dates" value={exp.dates || ''} onChange={e => updateExp(i, 'dates', e.target.value)} placeholder="时间" />
                  </div>
                ) : (
                  <>
                    <strong>{exp.company} | {exp.title}</strong>
                    <span className="paper-dates">{exp.dates}</span>
                  </>
                )}
              </div>
              <ul className="paper-highlights">
                {(exp.highlights || []).map((h, j) => (
                  <li key={j}>
                    {canEdit ? (
                      <input className="paper-inline-edit full" value={h} onChange={e => updateExpHighlight(i, j, e.target.value)} />
                    ) : h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {(!d.experiences || d.experiences.length === 0) && <p className="paper-empty">暂无工作经历</p>}
        </Section>

        {/* Education */}
        <Section heading="教育背景">
          {(d.education || []).map((edu, i) => (
            <div className="paper-block" key={i}>
              <div className="paper-block-head">
                {canEdit ? (
                  <div className="exp-edit-row">
                    <input className="paper-inline-edit" value={edu.school || ''} onChange={e => updateEdu(i, 'school', e.target.value)} placeholder="学校" />
                    <span className="edit-sep">|</span>
                    <input className="paper-inline-edit" value={edu.degree || ''} onChange={e => updateEdu(i, 'degree', e.target.value)} placeholder="学历" />
                    <input className="paper-inline-edit" value={edu.major || ''} onChange={e => updateEdu(i, 'major', e.target.value)} placeholder="专业" />
                    <input className="paper-inline-edit dates" value={edu.dates || ''} onChange={e => updateEdu(i, 'dates', e.target.value)} placeholder="时间" />
                  </div>
                ) : (
                  <>
                    <strong>{edu.school} | {edu.degree} {edu.major}</strong>
                    <span className="paper-dates">{edu.dates}</span>
                  </>
                )}
              </div>
            </div>
          ))}
          {(!d.education || d.education.length === 0) && <p className="paper-empty">暂无教育背景</p>}
        </Section>

        {/* Skills */}
        <Section heading="专业技能">
          {canEdit ? (
            <textarea className="paper-summary editable-textarea" value={(d.skills || []).join('、')} onChange={e => updateSkills(e.target.value)} rows={1} placeholder="技能1、技能2、技能3" />
          ) : (
            <div className="paper-skills">
              {(d.skills || []).map((s, i) => <span key={i} className="paper-skill-tag">{s}</span>)}
            </div>
          )}
          {(!d.skills || d.skills.length === 0) && <p className="paper-empty">暂无技能信息</p>}
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

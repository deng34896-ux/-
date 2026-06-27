import './SuggestionsPanel.css';

function ChangeBadge({ summary }) {
  if (!summary) return null;
  return <span className="change-badge">{summary}</span>;
}

export default function SuggestionsPanel({ suggestions, onAccept, onReject }) {
  if (!suggestions) return null;

  return (
    <div className="suggestions-panel">
      <div className="suggestions-header">
        <h3>AI 修改建议</h3>
        <div className="suggestions-actions">
          <button className="btn btn-reject" onClick={onReject}>放弃修改</button>
          <button className="btn btn-accept" onClick={onAccept}>全部接受</button>
        </div>
      </div>

      {suggestions.overall_suggestions && (
        <div className="suggestion-section overall">
          <h4>整体方向</h4>
          <p>{suggestions.overall_suggestions}</p>
        </div>
      )}

      {suggestions.summary && (
        <div className="suggestion-section">
          <h4>职业概要 <ChangeBadge summary="已根据岗位重写" /></h4>
          <p className="new-text">{suggestions.summary}</p>
        </div>
      )}

      {suggestions.experiences && suggestions.experiences.map((exp, i) => (
        <div className="suggestion-section" key={i}>
          <h4>{exp.company} - {exp.title} <ChangeBadge summary={exp.changes_summary} /></h4>
          <ul className="highlights-list">
            {exp.highlights && exp.highlights.map((h, j) => <li key={j}>{h}</li>)}
          </ul>
        </div>
      ))}

      {suggestions.skills && (
        <div className="suggestion-section">
          <h4>专业技能 <ChangeBadge summary={suggestions.skills_changes} /></h4>
          <div className="skills-tags">
            {suggestions.skills.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

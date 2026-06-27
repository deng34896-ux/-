import './JobInput.css';

export default function JobInput({ value, onChange, disabled }) {
  return (
    <div className="job-input">
      <div className="job-label-row">
        <h3 className="job-label">目标岗位描述</h3>
        <span className="job-hint">粘贴招聘 JD，AI 将据此优化简历</span>
      </div>
      <textarea
        className="job-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="在这里粘贴目标岗位的职位描述，内容越详细AI的建议越精准"
        disabled={disabled}
        rows={6}
      />
    </div>
  );
}

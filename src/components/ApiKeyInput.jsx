import './ApiKeyInput.css';

export default function ApiKeyInput({ value, onChange }) {
  return (
    <div className="api-key-input">
      <label className="api-label">Anthropic API Key</label>
      <input
        type="password"
        className="api-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="sk-ant-..."
      />
      <span className="api-note">你的 Key 仅在本地存储，不会上传到任何第三方</span>
    </div>
  );
}

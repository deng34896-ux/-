import './ApiKeyInput.css';

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic (Claude)', placeholder: 'sk-ant-...', hint: '从 console.anthropic.com 复制 Key' },
  { id: 'deepseek', name: 'DeepSeek', placeholder: 'sk-...', hint: '从 platform.deepseek.com 复制 Key' },
  { id: 'openai', name: 'OpenAI (GPT)', placeholder: 'sk-proj-...', hint: '从 platform.openai.com 复制 Key' },
];

export default function ApiKeyInput({ value, onChange, provider, onProviderChange }) {
  return (
    <div className="api-key-input">
      <label className="api-label">AI 模型</label>
      <div className="api-config">
        <select className="api-provider-select" value={provider} onChange={(e) => onProviderChange(e.target.value)}>
          {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input
          type="password"
          className="api-key-field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={PROVIDERS.find(p => p.id === provider)?.placeholder || '输入 API Key'}
        />
      </div>
      <span className="api-note">{PROVIDERS.find(p => p.id === provider)?.hint || 'Key 仅在本地存储'}</span>
    </div>
  );
}

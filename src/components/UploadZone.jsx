import { useRef } from 'react';
import './UploadZone.css';

export default function UploadZone({ onUpload, uploading, parsing, hasFile, fileName }) {
  const inputRef = useRef(null);
  const handleClick = () => inputRef.current?.click();
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className={'upload-zone' + (hasFile ? ' has-file' : '')} onClick={handleClick}>
      <input ref={inputRef} type="file" accept=".docx,.pdf" onChange={handleChange} hidden />
      {uploading ? (
        <div className="upload-state">
          <div className="spinner" />
          <p>正在解析简历...</p>
        </div>
      ) : hasFile ? (
        <div className="upload-state uploaded">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <p>{fileName}</p>
          {parsing ? (
            <span className="upload-hint">
              <span className="spinner-mini" /> AI 正在结构化解析...
            </span>
          ) : (
            <span className="upload-hint">点击重新上传</span>
          )}
        </div>
      ) : (
        <div className="upload-state">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <p>上传简历文件</p>
          <span className="upload-hint">支持 .docx 和 .pdf 格式</span>
        </div>
      )}
    </div>
  );
}

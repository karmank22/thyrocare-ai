import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config';

interface Props {
  onUploadComplete?: (extractedData: any) => void;
}

export default function ReportUpload({ onUploadComplete }: Props) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // Processing States
  const [uploading, setUploading] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = async (f: File) => {
    // 1. Validation
    if (f.type !== 'application/pdf') {
      setErrorMsg('Unsupported file type. Please upload a PDF report.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) { // 10MB limit
      setErrorMsg('File is too large. Maximum size is 10MB.');
      return;
    }

    setFile(f);
    setErrorMsg(null);
    setUploading(true);

    try {
      // Stage 1: Uploading
      setProcessingStage('✓ Uploading securely...');
      const formData = new FormData();
      formData.append('file', f);

      const token = localStorage.getItem('token');
      if (!token) throw new Error("Authentication required");

      // Stage 2: Reading Report
      setTimeout(() => setProcessingStage('✓ Reading Report...'), 500);

      const res = await fetch(`${API_BASE_URL}/api/assessments/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      // Stage 3: Extracting
      setProcessingStage('✓ Extracting Clinical Values...');
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to process report');
      }

      // Stage 4: AI Analysis
      setProcessingStage('✓ Running AI Analysis...');

      // Let the user read the final stage briefly before redirecting/updating context
      setTimeout(() => {
        setProcessingStage('✓ Assessment Complete');
        setTimeout(() => {
          if (onUploadComplete) {
            onUploadComplete(data.extracted);
          }
        }, 500);
      }, 500);

    } catch (e: any) {
      setErrorMsg(e.message || "An unexpected error occurred during processing.");
      setFile(null);
    } finally {
      // Do not set uploading to false if successful, so it naturally transitions away
      if (errorMsg) {
        setUploading(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div className="glass-card panel-card panel-upload animate-fadeInUp" id="panel-report-upload">
      <div className="panel-title">
        <div className="panel-title-icon">📄</div>
        {t('intake.upload_report')}
      </div>

      {!file || errorMsg ? (
        <div
          className={`upload-zone panel-upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          id="drop-zone"
        >
          <input type="file" ref={fileRef} accept=".pdf" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          
          <div className="upload-icon">📋</div>
          <div className="upload-title">{dragOver ? 'Release to upload' : 'Drop lab report here'}</div>
          <div className="upload-subtitle">PDF format only</div>
          
          {errorMsg && (
            <div className="upload-error" style={{ color: 'var(--risk-high)', fontSize: '0.8125rem', marginTop: '12px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '4px' }}>
              ⚠ {errorMsg}
            </div>
          )}
        </div>
      ) : (
        <div className="parsing-state">
          {processingStage !== '✓ Assessment Complete' && <div className="spinner" />}
          <div>
            <div className="parsing-title">Processing {file.name}</div>
            <div className="parsing-sub animate-fadeIn" style={{ color: 'var(--risk-normal)', fontWeight: 500 }}>
              {processingStage}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

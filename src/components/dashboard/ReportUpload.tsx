import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ExtractedValues { tsh: string; t3: string; t4: string; hb: string; vitD: string; }

export default function ReportUpload() {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractedValues | null>(null);
  const [parsing, setParsing] = useState(false);

  const handleFile = async (f: File) => {
    setFile(f);
    setParsing(true);
    // Simulate OCR/PDF parsing delay
    await new Promise(r => setTimeout(r, 1500));
    setExtracted({
      tsh: '5.8', t3: '3.1', t4: '1.1',
      hb: '11.2', vitD: '18.5',
    });
    setParsing(false);
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

      {!file ? (
        <div
          className={`upload-zone panel-upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          id="drop-zone"
        >
          <input type="file" ref={fileRef} accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="upload-icon">📋</div>
          <div className="upload-title">Drop lab report here</div>
          <div className="upload-subtitle">PDF · JPG · PNG</div>
          <div className="upload-method-tags">
            <span className="tag">PyMuPDF</span>
            <span className="tag">Tesseract OCR</span>
          </div>
        </div>
      ) : parsing ? (
        <div className="parsing-state">
          <div className="spinner" />
          <div>
            <div className="parsing-title">Parsing {file.name}...</div>
            <div className="parsing-sub">Extracting biomarkers via {file.type === 'application/pdf' ? 'PyMuPDF' : 'Tesseract OCR'}</div>
          </div>
        </div>
      ) : (
        <div className="extracted-values animate-fadeIn">
          <div className="extracted-header">
            <span>✅ {file.name}</span>
            <button className="btn-ghost btn" onClick={() => { setFile(null); setExtracted(null); }}>✕ Remove</button>
          </div>
          <div className="biomarker-grid">
            {extracted && ([
              { label: 'TSH', value: `${extracted.tsh} mIU/L`, range: '0.5–4.5', flag: parseFloat(extracted.tsh) > 4.5 ? 'elevated' : 'normal' },
              { label: 'Free T3', value: `${extracted.t3} pg/mL`, range: '2.0–4.4', flag: 'normal' },
              { label: 'Free T4', value: `${extracted.t4} ng/dL`, range: '0.8–1.8', flag: 'normal' },
              { label: 'Haemoglobin', value: `${extracted.hb} g/dL`, range: '12–15.5', flag: parseFloat(extracted.hb) < 12 ? 'borderline' : 'normal' },
              { label: 'Vitamin D', value: `${extracted.vitD} ng/mL`, range: '30–100', flag: parseFloat(extracted.vitD) < 20 ? 'borderline' : 'normal' },
            ]).map(b => (
              <div key={b.label} className={`biomarker-item biomarker-${b.flag}`}>
                <span className="biomarker-label">{b.label}</span>
                <span className="biomarker-value">{b.value}</span>
                <span className="biomarker-range">Ref: {b.range}</span>
                <span className={`biomarker-flag flag-${b.flag}`}>
                  {b.flag === 'normal' ? '✓ Normal' : b.flag === 'borderline' ? '⚠ Borderline' : '↑ Elevated'}
                </span>
              </div>
            ))}
          </div>
          <div className="parse-meta">
            <span className="tag">OCR Parse</span>
            <span className="tag">ICMR Ranges</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Parsed at {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

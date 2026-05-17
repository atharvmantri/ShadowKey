import { useState, useRef } from 'react';
import type { DocumentFile } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle2, X, ArrowLeft, ArrowRight, Shield, AlertCircle } from 'lucide-react';

interface DocumentUploadProps {
  isLoading: boolean;
  documents: DocumentFile[];
  onUpload: (file: DocumentFile) => Promise<boolean>;
  onContinue: () => Promise<void>;
  onBack: () => void;
}

const DOC_TYPES = [
  { value: 'passport' as const, label: 'Passport', icon: FileText },
  { value: 'license' as const, label: "Driver's License", icon: FileText },
  { value: 'id_card' as const, label: 'National ID Card', icon: FileText },
  { value: 'bill' as const, label: 'Utility Bill', icon: FileText },
  { value: 'statement' as const, label: 'Bank Statement', icon: FileText },
];

export function DocumentUpload({ isLoading, documents, onUpload, onContinue, onBack }: DocumentUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!selectedType) {
      setUploadError('Please select a document type first');
      return;
    }
    if (file.size > 10_000_000) {
      setUploadError('File too large. Maximum size is 10 MB.');
      return;
    }
    const allowedMime = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!allowedMime.includes(file.type) && !file.name.match(/\.(pdf|png|jpg|jpeg|webp)$/i)) {
      setUploadError('Invalid file type. Accepted: PDF, PNG, JPG, WEBP.');
      return;
    }
    setUploadError(null);
    setUploading(true);

    const doc: DocumentFile = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: file.name,
      type: selectedType as DocumentFile['type'],
      size: file.size,
      uploaded: false,
      verified: false,
    };

    try {
      await onUpload(doc);
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const hasUploaded = documents.some(d => d.uploaded);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <Upload className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Document Upload</h2>
            <p className="text-sm text-slate-400">Upload identity documents for verification. Each document is committed to the ledger via SHA256.</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Document type selector */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">Document Type</label>
          <div className="flex flex-wrap gap-2">
            {DOC_TYPES.map((dt) => {
              const Icon = dt.icon;
              const isSelected = selectedType === dt.value;
              return (
                <button
                  key={dt.value}
                  onClick={() => setSelectedType(dt.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {dt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Drop zone */}
        <motion.div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            dragOver
              ? 'border-purple-500 bg-purple-500/5'
              : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
          <motion.div
            animate={{ scale: dragOver ? 1.1 : 1 }}
            className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center"
          >
            <Upload className={`w-5 h-5 ${dragOver ? 'text-purple-300' : 'text-purple-400'}`} />
          </motion.div>
          <p className="text-sm text-slate-300 mb-1">
            {dragOver ? 'Drop file here' : 'Drag & drop a document, or click to browse'}
          </p>
          <p className="text-xs text-slate-600">Supports PDF, PNG, JPG up to 10MB</p>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2"
            >
              <AlertCircle className="w-3 h-3" /> {uploadError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Uploaded documents */}
        <AnimatePresence>
          {documents.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Uploaded Documents</p>
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate">{doc.name}</p>
                      <p className="text-xs text-slate-500">{doc.type.replace('_', ' ')} — {(doc.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {doc.uploaded ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </motion.div>
                    ) : uploading ? (
                      <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Info */}
        <motion.div
          className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-xs text-indigo-400/80 flex items-start gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>Documents are hashed into SHA256 commitments. The raw document data is never stored on-chain.</span>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="p-6 pt-4 border-t border-slate-800 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} disabled={isLoading} className="text-slate-400 hover:text-white gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          onClick={onContinue}
          disabled={isLoading || uploading || !hasUploaded}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white gap-2 px-6"
        >
          {isLoading ? 'Verifying...' : 'Verify Identity'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

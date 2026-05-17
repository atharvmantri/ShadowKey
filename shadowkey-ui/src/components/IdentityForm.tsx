import { useState } from 'react';
import type { IdentityFormData } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, User, Calendar, Globe, MapPin, CreditCard, Shield } from 'lucide-react';

interface IdentityFormProps {
  isLoading: boolean;
  onSubmit: (data: IdentityFormData) => Promise<void>;
  onBack: () => void;
}

const FIELDS: { key: keyof IdentityFormData; label: string; placeholder: string; type: string; icon: typeof User; validation: (v: string) => string | null }[] = [
  { key: 'name', label: 'Full Name', placeholder: 'e.g. John Michael Doe', type: 'text', icon: User, validation: (v) => v.length < 2 ? 'Name must be at least 2 characters' : null },
  { key: 'dob', label: 'Date of Birth', placeholder: 'YYYY-MM-DD', type: 'date', icon: Calendar, validation: (v) => !v ? 'Date of birth is required' : null },
  { key: 'nationality', label: 'Nationality', placeholder: 'e.g. United States', type: 'text', icon: Globe, validation: (v) => v.length < 2 ? 'Nationality is required' : null },
  { key: 'address', label: 'Residential Address', placeholder: 'e.g. 123 Main St, City, Country', type: 'text', icon: MapPin, validation: (v) => v.length < 5 ? 'Address must be at least 5 characters' : null },
  { key: 'idNumber', label: 'ID Number', placeholder: 'e.g. PAS123456', type: 'text', icon: CreditCard, validation: (v) => v.length < 3 ? 'ID number is required' : null },
];

export function IdentityForm({ isLoading, onSubmit, onBack }: IdentityFormProps) {
  const [formData, setFormData] = useState<IdentityFormData>({
    name: '', dob: '', nationality: '', address: '', idNumber: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof IdentityFormData, string>>>({});
  const [activeField, setActiveField] = useState<number>(-1);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof IdentityFormData, string>> = {};
    for (const field of FIELDS) {
      const err = field.validation(formData[field.key]);
      if (err) newErrors[field.key] = err;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <motion.div
      className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-6 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.1)]">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white tracking-[-0.02em]">Identity Submission</h2>
            <p className="text-sm text-[#6b7a9e]">Each field will be SHA256-hashed before committing to the ledger.</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {FIELDS.map((field, i) => {
          const Icon = field.icon;
          const isActive = activeField === i;
          const hasError = !!errors[field.key];
          const hasValue = !!formData[field.key];

          return (
            <motion.div
              key={field.key}
              className="relative"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Label htmlFor={field.key} className="text-sm font-medium text-[#a5b4fc] mb-1.5 block tracking-[-0.01em]">
                {field.label}
              </Label>
              <div className="relative">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors z-10 ${hasValue ? 'text-indigo-400' : hasError ? 'text-rose-400' : 'text-[#4f5b7a]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.key]}
                  disabled={isLoading}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, [field.key]: e.target.value }));
                    if (errors[field.key]) setErrors(prev => ({ ...prev, [field.key]: undefined }));
                  }}
                  onFocus={() => setActiveField(i)}
                  onBlur={() => setActiveField(-1)}
                  className={`pl-10 h-11 ${hasError ? 'border-rose-500/50 focus-visible:ring-rose-500/20' : isActive ? 'border-indigo-500/50' : ''}`}
                />
                {hasValue && (
                  <motion.div
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                  </motion.div>
                )}
              </div>
              {hasError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-rose-400 mt-1"
                >
                  {errors[field.key]}
                </motion.p>
              )}
              <motion.div
                className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-indigo-500 via-violet-500 to-transparent"
                initial={{ width: '0%' }}
                animate={{ width: isActive ? '100%' : '0%' }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          );
        })}

        <motion.div
          className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-400/80 flex items-start gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>Your data is hashed locally before being sent to the ledger. Raw identity data never leaves this browser.</span>
        </motion.div>
      </div>

      <div className="p-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} disabled={isLoading} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !formData.name || !formData.dob || !formData.nationality || !formData.address || !formData.idNumber}
          className="gap-2 px-6"
        >
          {isLoading ? 'Submitting...' : 'Submit Identity'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

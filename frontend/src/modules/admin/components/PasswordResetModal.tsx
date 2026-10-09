import React, { useState } from 'react';
import {
  KeyRound,
  X,
  Copy,
  Check,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { UserAccount } from '../types';
import { adminApi } from '../api';

interface PasswordResetModalProps {
  user: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onPasswordReset: (user: UserAccount) => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  user,
  isOpen,
  onClose,
  onPasswordReset,
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleReset = async () => {
    setIsResetting(true);
    setError(null);
    try {
      const res = await adminApi.resetPassword(user.id);
      setTemporaryPassword(res.temporaryPassword);
      onPasswordReset({
        ...user,
        status: 'ACTIVE',
        failedLoginAttempts: 0,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopy = () => {
    if (temporaryPassword) {
      navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleClose = () => {
    setTemporaryPassword(null);
    setCopied(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Reset User Password</h3>
              <p className="text-xs text-slate-400">Issue Administrative Temporary Credential</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              @{user.username} • {user.email}
            </div>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-300 font-medium px-2 py-0.5 rounded border border-slate-700">
            {user.role}
          </span>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
            {error}
          </div>
        )}

        {!temporaryPassword ? (
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                Resetting this password will generate a secure one-time temporary passkey and clear any active failed login locks. The staff member will be required to change this credential on initial login.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleReset}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-900/30 transition disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isResetting ? 'Generating...' : 'Confirm Reset Password'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
              <div className="text-xs text-emerald-300 font-medium">
                Temporary Password Generated Successfully:
              </div>
              <div className="flex items-center justify-between gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="font-mono text-sm tracking-widest text-emerald-400 font-bold select-all">
                  {temporaryPassword}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md flex items-center gap-1.5 transition border border-slate-700"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Please deliver this credential directly to the staff member via verified internal communication.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

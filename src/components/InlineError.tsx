import React from 'react';
import { ShieldAlert, AlertTriangle, X } from 'lucide-react';

export interface InlineErrorProps {
  title: string;
  message: string;
  isSecurityViolation: boolean;
  onDismiss?: () => void;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  title,
  message,
  isSecurityViolation,
  onDismiss,
}) => {
  return (
    <div
      role="alert"
      className={`rounded-xl p-4.5 flex items-start gap-3.5 shadow-xs border transition-all duration-200 ${
        isSecurityViolation
          ? 'bg-amber-50/90 border-amber-300/80 text-amber-950'
          : 'bg-red-50/90 border-red-200 text-red-950'
      }`}
    >
      <div className="shrink-0 mt-0.5">
        {isSecurityViolation ? (
          <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
        ) : (
          <div className="p-1.5 bg-red-100 rounded-lg text-red-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`text-sm font-semibold tracking-tight ${
              isSecurityViolation ? 'text-amber-900' : 'text-red-900'
            }`}
          >
            {title}
          </h3>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss error"
              className="text-slate-400 hover:text-slate-600 rounded-md p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p
          className={`text-sm mt-1 leading-relaxed break-words ${
            isSecurityViolation ? 'text-amber-800' : 'text-red-700'
          }`}
        >
          {message}
        </p>
        {isSecurityViolation && (
          <p className="text-xs text-amber-700/90 mt-2.5 font-medium bg-amber-100/60 rounded-md p-2 border border-amber-200/50">
            Defense-in-depth policy active: destructive keywords, multi-statement queries, and prompt injection signatures are blocked.
          </p>
        )}
      </div>
    </div>
  );
};


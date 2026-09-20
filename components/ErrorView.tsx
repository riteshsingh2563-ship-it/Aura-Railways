'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ message, onRetry }) => {
  return (
    <div className="p-6 rounded-2xl glass-panel border border-red-500/30 text-center space-y-4">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-white">
          Connection or Service Error
        </h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          {message || 'The railway data service encountered an unexpected error. Please check your network and retry.'}
        </p>
      </div>

      <button
        onClick={onRetry}
        className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs inline-flex items-center gap-2 transition-colors shadow-lg shadow-cyan-600/20"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  );
};

import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = 'Loading data...' }) => (
  <div className="flex flex-col items-center justify-center p-12 text-slate-500">
    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
    <p className="text-sm font-medium">{message}</p>
  </div>
);

export const EmptyState = ({ title = 'No results found', description, icon: Icon, action }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center">
    {Icon && (
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-400">
        <Icon className="w-6 h-6" />
      </div>
    )}
    <h3 className="text-sm font-bold text-navy mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>}
    {action && action}
  </div>
);


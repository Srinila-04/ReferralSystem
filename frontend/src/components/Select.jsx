import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({ 
  label, 
  error, 
  options = [], 
  children,
  className = '', 
  id,
  ...props 
}, ref) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          className={`w-full pl-3.5 pr-9 py-2.5 bg-white border rounded-xl text-sm font-medium transition-all shadow-xs appearance-none cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-secondary/25 focus:border-secondary
            hover:border-slate-300
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${error ? 'border-rose-300 text-rose-900 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 text-slate-800'}
            ${className}
          `}
          {...props}
        >
          {children
            ? children
            : options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;


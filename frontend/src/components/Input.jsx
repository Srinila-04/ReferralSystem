import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({ 
  label, 
  error, 
  className = '', 
  id,
  type = 'text',
  ...props 
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const [showPassword, setShowPassword] = useState(false);
  
  const isPasswordInput = type === 'password';
  const inputType = isPasswordInput ? (showPassword ? 'text' : 'password') : type;
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          type={inputType}
          className={`w-full px-3 py-2 bg-white border rounded-lg text-sm transition-colors
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
            disabled:bg-slate-50 disabled:text-slate-500
            ${isPasswordInput ? 'pr-10' : ''}
            ${error ? 'border-red-300 text-red-900 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 text-slate-900'}
            ${className}
          `}
          {...props}
        />
        {isPasswordInput && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex="-1"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;


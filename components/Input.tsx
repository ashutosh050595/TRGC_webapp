import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, helperText, error, className, ...props }) => {
  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      <label className="text-sm font-semibold text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all
          ${error 
            ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
            : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
          }
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {!error && helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
};
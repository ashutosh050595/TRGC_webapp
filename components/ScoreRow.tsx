import React from 'react';

interface ScoreRowProps {
  sNo: string;
  particulars: string;
  marksCriteria: string;
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
  max?: number; // Optional max value constraint
}

export const ScoreRow: React.FC<ScoreRowProps> = ({ sNo, particulars, marksCriteria, value, onChange, error, max }) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Allow clearing the field
    if (val === '') {
      onChange(val);
      return;
    }

    const numVal = parseFloat(val);

    // Validate number
    if (!isNaN(numVal)) {
      // 1. Prevent negative numbers
      if (numVal < 0) return;

      // 2. Prevent exceeding max value (if max is defined)
      if (max !== undefined && numVal > max) {
        // We simply ignore the input if it exceeds max, effectively blocking it
        return; 
      }

      onChange(val);
    }
  };

  return (
    <tr className="border-b hover:bg-slate-50">
      <td className="p-3 align-top font-medium text-gray-600">{sNo}</td>
      <td className="p-3 align-top text-gray-800">{particulars}</td>
      <td className="p-3 align-top text-sm text-gray-500">{marksCriteria}</td>
      <td className="p-3 align-top">
        <input
          type="number"
          placeholder="0"
          className={`w-24 px-2 py-1 border rounded text-right focus:ring-2 outline-none transition-all
            ${error ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300 focus:ring-blue-500'}
          `}
          value={value}
          onChange={handleChange}
          min="0"
          max={max}
        />
        {max !== undefined && (
          <div className="text-[10px] text-gray-400 text-right mt-1 font-medium">
            Max: {max}
          </div>
        )}
      </td>
    </tr>
  );
};
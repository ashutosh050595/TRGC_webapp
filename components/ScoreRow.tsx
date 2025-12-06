import React from 'react';

interface ScoreRowProps {
  sNo: string;
  particulars: string;
  marksCriteria: string;
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
  max?: number; 
  labelClass?: string; // New prop for bold/styling text
}

export const ScoreRow: React.FC<ScoreRowProps> = ({ sNo, particulars, marksCriteria, value, onChange, error, max, labelClass }) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(val);
      return;
    }
    const numVal = parseFloat(val);
    if (!isNaN(numVal)) {
      if (numVal < 0) return;
      if (max !== undefined && numVal > max) {
        return; 
      }
      onChange(val);
    }
  };

  return (
    <tr className="border-b hover:bg-slate-50">
      <td className="p-2 align-top font-medium text-gray-600 text-xs md:text-sm">{sNo}</td>
      <td className={`p-2 align-top text-gray-800 text-xs md:text-sm ${labelClass || ''}`}>{particulars}</td>
      <td className="p-2 align-top text-xs text-gray-500">{marksCriteria}</td>
      <td className="p-2 align-top">
        <input
          type="number"
          placeholder="0"
          className={`w-20 px-2 py-1 border rounded text-right focus:ring-2 outline-none transition-all text-sm
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
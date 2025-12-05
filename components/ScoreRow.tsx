import React from 'react';

interface ScoreRowProps {
  sNo: string;
  particulars: string;
  marksCriteria: string;
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
}

export const ScoreRow: React.FC<ScoreRowProps> = ({ sNo, particulars, marksCriteria, value, onChange, error }) => {
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
          onChange={(e) => onChange(e.target.value)}
        />
      </td>
    </tr>
  );
};
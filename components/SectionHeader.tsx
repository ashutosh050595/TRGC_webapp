import React from 'react';

export const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-6 border-b pb-2">
    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);
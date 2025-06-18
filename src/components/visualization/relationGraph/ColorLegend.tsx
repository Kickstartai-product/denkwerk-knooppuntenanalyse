// src/components/ColorLegend.tsx

import React from 'react';

interface ColorLegendProps {
  categories: { name: string; color: string; }[];
}

const ColorLegend: React.FC<ColorLegendProps> = ({ categories }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200/50">
      <div className="space-y-1.5">
        {categories.map(({ name, color }) => (
          <div key={name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs leading-tight text-gray-700">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorLegend;
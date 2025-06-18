import React from 'react';

// Define the category color mapping, matching the second legend's visual style.
export const categoryColors: Record<string, string> = {
  'Sociaal & Maatschappelijk': '#0699a9',
  'Economisch': '#702f8e',
  'Ecologisch': '#84b440',
  'Geopolitiek & militair': '#a8aaad',
  'Technologisch & digitaal': '#abccd5',
  'Gezondheid': '#e42259'
};

// Define colors for other visual elements.
const nodeColor = '#888888';
const edgeColor = '#555555';

interface ColorLegendProps {
  className?: string;
  title?: string; // Optional title for the legend
}

const ColorLegend: React.FC<ColorLegendProps> = ({ className = '', title }) => {
  return (
    <div
      // The background opacity has been changed from 85% to 75% here
      className={`bg-white/50 backdrop-blur-md p-4 rounded-lg shadow-lg border border-gray-200/50 w-60 text-gray-800 ${className}`}
    >
      {/* Optional Title */}
      {title && (
        <h3 className="text-sm font-bold text-center mb-3">{title}</h3>
      )}

      {/* Categories Section */}
      <div>
        <h4 className="text-xs font-bold mb-2">Categorieën</h4>
        <div className="space-y-2">
          {Object.entries(categoryColors).map(([category, color]) =>
            category.toLowerCase() !== 'unknown' && (
              <div key={category} className="flex items-center gap-2.5">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs">{category}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Spacer */}
      <hr className="my-3 border-gray-200/80" />

      {/* verwevenheid (Node Size) Section */}
      <div className="text-center">
        <h4 className="text-xs font-bold text-gray-700 mb-1.5">verwevenheid</h4>
        <div className="flex items-center justify-center gap-2.5">
          <span className="text-xs text-gray-600">Laag</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: nodeColor }}></div>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColor }}></div>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: nodeColor }}></div>
          </div>
          <span className="text-xs text-gray-600">Hoog</span>
        </div>
      </div>

      {/* Spacer */}
      <hr className="my-3 border-gray-200/80" />

      {/* Impact Gevolg (Edge Impact) Section */}
      <div className="text-center">
        <h4 className="text-xs font-bold text-gray-700 mb-2">Impact gevolg</h4>
        <div className="flex items-center justify-center gap-2.5">
          <span className="text-xs text-gray-600">Laag</span>
          <div className="flex items-end gap-1.5">
            <div className="w-6 h-1 rounded-sm" style={{ backgroundColor: edgeColor, opacity: 0.4 }}></div>
            <div className="w-6 h-2 rounded-sm" style={{ backgroundColor: edgeColor, opacity: 0.7 }}></div>
            <div className="w-6 h-3 rounded-sm" style={{ backgroundColor: edgeColor, opacity: 1.0 }}></div>
          </div>
          <span className="text-xs text-gray-600">Hoog</span>
        </div>
      </div>
    </div>
  );
};

export default ColorLegend;
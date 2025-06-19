import React from 'react';
import { useWindowSize, MOBILE_BREAKPOINT } from '@/hooks/useWindowSize';

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
  const windowWidth = useWindowSize();
  const isMobile = windowWidth !== null && windowWidth < MOBILE_BREAKPOINT;

  return (
    <div
      // The background opacity has been changed from 85% to 75% here
      className={`bg-white/50 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 text-gray-800 ${
        isMobile 
          ? 'p-2 w-48' // Mobile: smaller padding and width
          : 'p-4 w-60' // Desktop: original size
      } ${className}`}
    >
      {/* Optional Title */}
      {title && (
        <h3 className={`font-bold text-center ${isMobile ? 'text-xs mb-2' : 'text-sm mb-3'}`}>
          {title}
        </h3>
      )}

      {/* Categories Section */}
      <div>
        <h4 className={`font-bold ${isMobile ? 'text-[10px] mb-1' : 'text-xs mb-2'}`}>
          Categorieën
        </h4>
        <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
          {Object.entries(categoryColors).map(([category, color]) =>
            category.toLowerCase() !== 'unknown' && (
              <div key={category} className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2.5'}`}>
                <div
                  className={isMobile ? 'w-2.5 h-2.5 rounded-full' : 'w-3.5 h-3.5 rounded-full'}
                  style={{ backgroundColor: color }}
                />
                <span className={isMobile ? 'text-[10px]' : 'text-xs'}>
                  {isMobile ? category.split(' ')[0] : category} {/* Truncate on mobile */}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Spacer */}
      <hr className={`border-gray-200/80 ${isMobile ? 'my-2' : 'my-3'}`} />

      {/* verwevenheid (Node Size) Section */}
      <div className="text-center">
        <h4 className={`font-bold text-gray-700 ${isMobile ? 'text-[10px] mb-1' : 'text-xs mb-1.5'}`}>
          verwevenheid
        </h4>
        <div className={`flex items-center justify-center ${isMobile ? 'gap-1.5' : 'gap-2.5'}`}>
          <span className={`text-gray-600 ${isMobile ? 'text-[9px]' : 'text-xs'}`}>
            {isMobile ? 'Bep.' : 'Beperkt'}
          </span>
          <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
            <div 
              className={isMobile ? 'w-1.5 h-1.5 rounded-full' : 'w-2 h-2 rounded-full'} 
              style={{ backgroundColor: nodeColor }}
            />
            <div 
              className={isMobile ? 'w-2 h-2 rounded-full' : 'w-3 h-3 rounded-full'} 
              style={{ backgroundColor: nodeColor }}
            />
            <div 
              className={isMobile ? 'w-2.5 h-2.5 rounded-full' : 'w-4 h-4 rounded-full'} 
              style={{ backgroundColor: nodeColor }}
            />
          </div>
          <span className={`text-gray-600 ${isMobile ? 'text-[9px]' : 'text-xs'}`}>
            Groot
          </span>
        </div>
      </div>

      {/* Spacer */}
      <hr className={`border-gray-200/80 ${isMobile ? 'my-2' : 'my-3'}`} />

      {/* Impact Gevolg (Edge Impact) Section */}
      <div className="text-center">
        <h4 className={`font-bold text-gray-700 ${isMobile ? 'text-[10px] mb-1' : 'text-xs mb-2'}`}>
          Impact gevolg
        </h4>
        <div className={`flex items-center justify-center ${isMobile ? 'gap-1.5' : 'gap-2.5'}`}>
          <span className={`text-gray-600 ${isMobile ? 'text-[9px]' : 'text-xs'}`}>
            Laag
          </span>
          <div className={`flex items-end ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
            <div 
              className={isMobile ? 'w-4 h-0.5 rounded-sm' : 'w-6 h-1 rounded-sm'} 
              style={{ backgroundColor: edgeColor, opacity: 0.4 }}
            />
            <div 
              className={isMobile ? 'w-4 h-1 rounded-sm' : 'w-6 h-2 rounded-sm'} 
              style={{ backgroundColor: edgeColor, opacity: 0.7 }}
            />
            <div 
              className={isMobile ? 'w-4 h-1.5 rounded-sm' : 'w-6 h-3 rounded-sm'} 
              style={{ backgroundColor: edgeColor, opacity: 1.0 }}
            />
          </div>
          <span className={`text-gray-600 ${isMobile ? 'text-[9px]' : 'text-xs'}`}>
            Hoog
          </span>
        </div>
      </div>
    </div>
  );
};

export default ColorLegend;
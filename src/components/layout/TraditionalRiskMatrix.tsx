import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const TraditionalRiskMatrix = () => {
  const [showNew, setShowNew] = useState(false);

  // Added 'newSize' property to control the dot size in the "new approach" view.
  const risks = [
    { name: "Cyberaanval", probability: 85, impact: 75, x: 85, y: 50, newSize: 'w-7 h-7' },
    { name: "Overstroming", probability: 30, impact: 90, x: 30, y: 90, newSize: 'w-4 h-4' },
    { name: "Pandemie", probability: 25, impact: 85, x: 25, y: 70, newSize: 'w-5 h-5' },
    { name: "Droogte", probability: 70, impact: 60, x: 75, y: 70, newSize: 'w-7 h-7' },
    { name: "Polarisatie", probability: 80, impact: 55, x: 70, y: 20, newSize: 'w-9 h-9' },
    { name: "Energietekort", probability: 45, impact: 70, x: 45, y: 30, newSize: 'w-6 h-6' },
  ];


  return (
    <div className="space-y-4">
      {/* --- Control Buttons --- */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setShowNew(false)}
          className={`px-4 py-2 rounded-lg transition-all font-medium ${
            !showNew
              ? 'bg-[rgb(0,153,168)] text-white shadow-md scale-105'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Traditionele benadering
        </button>
        <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <button
          onClick={() => setShowNew(true)}
          className={`px-4 py-2 rounded-lg transition-all font-medium ${
            showNew
              ? 'bg-[rgb(0,153,168)] text-white shadow-md scale-105'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Nieuwe benadering
        </button>
      </div>

      {/* --- Visualization Canvas --- */}
      <div className="w-full h-80 relative bg-white rounded-lg overflow-hidden border border-slate-200">
        <div className="absolute inset-0 p-6">
          {/* Grid lines with reduced opacity */}
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="gridMatrix" width="10%" height="10%" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridMatrix)" />
          </svg>

          {/* Axes labels */}
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500">
            Waarschijnlijkheid →
          </div>
          <div className="absolute left-1.5 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs font-medium text-gray-500">
            Impact →
          </div>

          {/* Risk dots with dynamic sizing and persistent labels */}
          {risks.map((risk, index) => (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${risk.x}%`,
                bottom: `${risk.y}%`,
                transition: 'left 0.5s ease-in-out, bottom 0.5s ease-in-out'
              }}
            >
              <div
                className={`
                  rounded-full bg-[rgb(0,153,168)] shadow-lg border-2 border-white/50
                  transition-all duration-500 ease-in-out
                  ${showNew ? risk.newSize : 'w-3.5 h-3.5'}
                `}
              />
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-gray-600 text-xs font-medium whitespace-nowrap z-10 pointer-events-none">
                {risk.name}
              </div>
            </div>
          ))}

          {/* Risk zones (subtle text) */}
          <div className="absolute bottom-1 left-1 text-xs font-medium text-gray-400">Laag risico</div>
          <div className="absolute top-1 right-1 text-xs font-medium text-gray-400">Hoog risico</div>

          {/* --- Legend for New Approach --- */}
          <div className={`absolute top-3 left-3 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md border border-slate-200 transition-all duration-300 ease-in-out ${showNew ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
            <div className="text-center text-xs font-bold text-gray-700 mb-1">Verwevenheid</div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500">Laag</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[rgb(0,153,168)]/70"></div>
                <div className="w-3 h-3 rounded-full bg-[rgb(0,153,168)]/85"></div>
                <div className="w-4 h-4 rounded-full bg-[rgb(0,153,168)]"></div>
              </div>
              <span className="text-xs text-gray-500">Hoog</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraditionalRiskMatrix;
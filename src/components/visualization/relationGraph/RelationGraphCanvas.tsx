// src/components/RelationGraphCanvas.tsx

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Assuming shadcn/ui select
import { shortNodeDescriptions } from '../shortNodeDescriptions'; // Your data helper
import { GraphCanvas } from './GraphCanvas';
import { ShieldAlert } from "lucide-react";


// --- TYPE DEFINITIONS ---
export interface Node {
  id: string;
  label: string;
  summary: string;
  citaten: any[];
  nr_docs: number;
  nr_citations: number;
  data?: {
    [key: string]: any;
  };
  category: string;
  fill?: string;
  [key: string]: any;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
  citaat_relaties: any[];
  raw_count: number;
  [key:string]: any;
}

// --- CONSTANTS & HELPERS ---
export const categoryColors: Record<string, string> = {
  'Sociaal & Maatschappelijk': '#0699a9',
  'Economisch': '#702f8e',
  'Ecologisch': '#84b440',
  'Geopolitiek & militair': '#a8aaad',
  'Technologisch & digitaal': '#abccd5',
  'Gezondheid': '#e42259'
};

const EDGE_HOVER_COLOR = '#FF8C42';

const allCategoriesForLegend = Object.entries(categoryColors).map(
  ([name, color]) => ({ name, color })
);

const formatDocumentLink = (link: string): string => {
  if (link && link.startsWith('/')) {
    return `https://open.overheid.nl${link}`;
  }
  return link || '#';
};

const renderCitationParts = (citationText: string) => {
  if (!citationText.includes(" ||| ")) {
    return <div className="italic bg-gray-100 p-3 rounded text-sm text-left">"{citationText}"</div>;
  }
  const parts = citationText.split(" ||| ");
  return (
    <div className="space-y-2">
      {parts.map((part, i) => (
        <div key={i} className="italic bg-gray-100 p-3 rounded text-sm text-left">
          "{part.trim()}"
        </div>
      ))}
    </div>
  );
};

// --- HELPER COMPONENTS ---

const CitationPopup = ({ edge, onClose }: { edge: Edge; onClose: () => void; }) => {
    if (!edge) return null;

    return (
      <div className="absolute inset-0 flex items-center justify-center p-4 bg-gray-500 bg-opacity-20 z-50" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[540px] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-800">Representatieve citaten</h2>
            <button onClick={onClose} className="text-2xl font-light text-gray-500 hover:text-gray-900 leading-none">&times;</button>
          </div>

        <div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex-shrink-0">
        <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          Door <a href="https://www.rijksoverheid.nl/documenten" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">overheidswerkzaamheden</a> zijn sommige onderliggende documenten tijdelijk niet beschikbaar.
        </p>
      </div>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
            {edge.citaat_relaties && edge.citaat_relaties.length > 0 ? (
              edge.citaat_relaties.map((citation, index) => (
                <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <a href={formatDocumentLink(citation.document_link)} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-800 hover:underline flex-1 mr-2">
                      {citation.title || "Onbekende Titel"}
                    </a>
                  </div>
                  <div className="flex flex-wrap text-xs text-gray-500 mb-3 space-x-2">
                    {citation.publication_date && <div>{citation.publication_date.slice(0, 7)}</div>}
                    {citation.publication_date && citation.source && <div>•</div>}
                    {citation.source && <div>{citation.source}</div>}
                  </div>
                  <div className="text-sm mt-2">
                    <div className="flex gap-2 mb-1">
                      <span className="text-xs font-medium bg-gray-200 px-2 py-0.5 rounded w-16 flex-shrink-0 text-center">Oorzaak</span>
                      <span className="text-left flex-1 text-gray-700">{citation.oorzaak}</span>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <span className="text-xs font-medium bg-gray-200 px-2 py-0.5 rounded w-16 flex-shrink-0 text-center">Gevolg</span>
                      <span className="text-left flex-1 text-gray-700">{citation.gevolg}</span>
                    </div>
                    {renderCitationParts(citation.citaat)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                Geen citaties beschikbaar voor deze verbinding.
              </div>
            )}
          </div>
        </div>
      </div>
    );
};

const ColorLegend = ({ categories }: { categories: { name: string; color: string; }[] }) => {
  return (
<div className="bg-white/95 p-3 rounded-lg shadow-lg border border-gray-200/50">
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


// --- MAIN COMPONENT ---

interface RelationGraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
}

export const RelationGraphCanvas = ({ nodes, edges }: RelationGraphCanvasProps) => {
  const [selectedThreat, setSelectedThreat] = useState<string>('polarisatie rond complottheorieën');
  const [displayedThreat, setDisplayedThreat] = useState<string>(selectedThreat);
  const [isGraphVisible, setIsGraphVisible] = useState<boolean>(true);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const safeNodes = nodes || [];
  const safeEdges = edges || [];

  useEffect(() => {
    if (selectedThreat !== displayedThreat) {
      setIsGraphVisible(false);
      const timer = setTimeout(() => {
        setDisplayedThreat(selectedThreat);
        setIsGraphVisible(true);
      }, 300); // Duration matches CSS transition
      return () => clearTimeout(timer);
    }
  }, [selectedThreat, displayedThreat]);

  const { filteredNodes, filteredEdges } = useMemo(() => {
    if (safeNodes.length === 0) {
      return { filteredNodes: [], filteredEdges: [] };
    }
    let relevantNodes: Node[];
    let relevantEdges: Edge[];
    if (displayedThreat) {
      const firstOrderConnections = safeEdges.filter(edge => edge.source === displayedThreat).sort((a, b) => (b.weight || 0) - (a.weight || 0)).slice(0, 6);
      const firstOrderTargets = new Set(firstOrderConnections.map(edge => edge.target));
      const secondOrderConnections = safeEdges.filter(edge => firstOrderTargets.has(edge.source) && edge.target !== displayedThreat && !firstOrderTargets.has(edge.target)).sort((a, b) => (b.weight || 0) - (a.weight || 0)).slice(0, 6);
      const secondOrderTargets = new Set(secondOrderConnections.map(edge => edge.target));
      const relevantNodeIds = new Set([displayedThreat, ...firstOrderTargets, ...secondOrderTargets]);
      relevantNodes = safeNodes.filter(node => relevantNodeIds.has(node.id));
      relevantEdges = [...firstOrderConnections, ...secondOrderConnections];
    } else {
      relevantNodes = [];
      relevantEdges = [];
    }
    const processedNodes = relevantNodes.map(node => {
      const category = node.category || 'unknown';
      const color = categoryColors[category] || '#A9A9A9';
      const label = shortNodeDescriptions[node.id] || node.label || node.id;
      return { ...node, fill: color, label: label };
    });
    const processedEdges = relevantEdges.map(edge => {
      const weight = edge.weight || 1;
      const size = Math.max(1, Math.min(4, Math.round(weight * 2)));
      return { ...edge, size };
    });
    return { filteredNodes: processedNodes, filteredEdges: processedEdges };
  }, [displayedThreat, safeNodes, safeEdges]);

  const nodesWithOutgoingConnections = useMemo(() => {
    if (safeNodes.length === 0) return [];
    const nodesWithOutgoing = new Set<string>();
    safeEdges.forEach(edge => nodesWithOutgoing.add(edge.source));
    return safeNodes.filter(node => nodesWithOutgoing.has(node.id));
  }, [safeNodes, safeEdges]);

  const selectedThreatDisplayLabel = useMemo(() => {
    if (!selectedThreat) return null;
    return shortNodeDescriptions[selectedThreat] || selectedThreat;
  }, [selectedThreat]);

  const handleEdgeClick = useCallback((edge: Edge) => {
    setSelectedEdge(current => (current && current.id === edge.id ? null : edge));
  }, []);

  if (nodes.length === 0) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-center">
          <div className="w-80 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden" style={{ height: '600px' }}>
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Wachten op netwerkdata...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-center">
        <div className="w-80">
          <Select value={selectedThreat} onValueChange={setSelectedThreat}>
            <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
              <SelectValue placeholder="Selecteer een dreiging...">
                {selectedThreatDisplayLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {nodesWithOutgoingConnections
                .sort((a, b) => a.label.localeCompare(b.label))
                .map((node) => (
                  <SelectItem
                    key={node.id}
                    value={node.id}
                    className="hover:bg-gray-100 focus:bg-blue-50"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{shortNodeDescriptions[node.id] || node.label}</span>
                      {node.summary && (
                        <span className="text-xs text-gray-500 truncate max-w-60">
                          {node.summary}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div
          className={`transition-opacity duration-300 ease-in-out ${isGraphVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ width: '100%', height: '600px', position: 'relative' }}
        >
          {filteredNodes.length > 0 ? (
            <GraphCanvas
              nodes={filteredNodes}
              edges={filteredEdges}
              onEdgeClick={handleEdgeClick}
              edgeHoverColor={EDGE_HOVER_COLOR}
            />
          ) : (
             <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Geen data om te visualiseren voor deze selectie.</div>
            </div>
          )}

          <div className="absolute bottom-4 left-4 z-10">
              <ColorLegend categories={allCategoriesForLegend} />
          </div>

          {selectedEdge && (
            <CitationPopup
              edge={selectedEdge}
              onClose={() => setSelectedEdge(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { GraphCanvas, GraphCanvasRef, lightTheme } from 'reagraph';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { shortNodeDescriptions } from '../shortNodeDescriptions';

// --- (Interfaces: Node, Edge, categoryColors, theme, etc. remain unchanged) ---
export interface Node {
  id: string;
  label: string;
  summary: string;
  citaten: any[];
  nr_docs: number;
  nr_citations: number;
  data?: {
    eigen_centrality?: number;
    eigen_centrality_in?: number;
    eigen_centrality_out?: number;
    eigen_centrality_cross_category?: number;
    eigen_centrality_in_cross_category?: number;
    eigen_centrality_out_cross_category?: number;
    [key: string]: any;
  };
  category: string;
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

export const categoryColors: Record<string, string> = {
  'Sociaal & Maatschappelijk': '#0699a9',
  'Economisch': '#702f8e',
  'Ecologisch': '#84b440',
  'Geopolitiek & militair': '#a8aaad',
  'Technologisch & digitaal': '#abccd5',
  'Gezondheid': '#e42259'
};

const theme = {
  ...lightTheme,
  node: {
    ...lightTheme.node,
    activeFill: '#FF8C42',
    label: { ...lightTheme.node.label, activeColor: '#FF8C42' },
  },
  edge: {
    ...lightTheme.edge,
    activeStroke: '#FF8C42',
    activeFill: '#FF8C42',
    opacity: 0.5,
  },
  arrow: { ...lightTheme.arrow, activeFill: '#FF8C42' },
  ring: { ...lightTheme.ring, activeFill: '#FF8C42' },
  cluster: null as any,
};

interface RelationGraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
}

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

const CitationPopup = ({ edge, onClose }: { edge: Edge; onClose: () => void; }) => {
    if (!edge) return null;

    return (
      <div className="absolute inset-0 flex items-center justify-center p-4 bg-gray-500 bg-opacity-20" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[540px] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-800">Representatieve citaten</h2>
            <button onClick={onClose} className="text-2xl font-light text-gray-500 hover:text-gray-900 leading-none">&times;</button>
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

// --- START: MODIFIED COMPONENT ---
export const RelationGraphCanvas = ({ nodes, edges }: RelationGraphCanvasProps) => {
  const [selectedThreat, setSelectedThreat] = useState<string>('polarisatie rond complottheorieën');
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const graphRef = useRef<GraphCanvasRef | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // <-- NEW: State for loading indicator and manual refresh -->
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const safeNodes = nodes || [];
  const safeEdges = edges || [];

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // --- (useMemo hooks for data filtering remain unchanged) ---
  const nodesWithOutgoingConnections = useMemo(() => {
    if (safeNodes.length === 0) return [];
    const nodesWithOutgoing = new Set<string>();
    safeEdges.forEach(edge => {
      nodesWithOutgoing.add(edge.source);
    });
    return safeNodes.filter(node => nodesWithOutgoing.has(node.id));
  }, [safeNodes, safeEdges]);
  const selectedThreatDisplayLabel = useMemo(() => {
    if (!selectedThreat) return null;
    return shortNodeDescriptions[selectedThreat] || selectedThreat;
  }, [selectedThreat]);
  const { filteredNodes, filteredEdges } = useMemo(() => {
    if (safeNodes.length === 0) {
      return { filteredNodes: [], filteredEdges: [] };
    }

    let relevantNodes: Node[];
    let relevantEdges: Edge[];

    if (selectedThreat) {
      const firstOrderConnections = safeEdges
        .filter(edge => edge.source === selectedThreat)
        .sort((a, b) => (b.weight || 0) - (a.weight || 0))
        .slice(0, 6);

      const firstOrderTargets = new Set(firstOrderConnections.map(edge => edge.target));

      const secondOrderConnections = safeEdges
        .filter(edge =>
          firstOrderTargets.has(edge.source) &&
          edge.target !== selectedThreat &&
          !firstOrderTargets.has(edge.target)
        )
        .sort((a, b) => (b.weight || 0) - (a.weight || 0))
        .slice(0, 6);

      const secondOrderTargets = new Set(secondOrderConnections.map(edge => edge.target));

      const relevantNodeIds = new Set([
        selectedThreat,
        ...firstOrderTargets,
        ...secondOrderTargets
      ]);

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
      return { ...node, fill: color, color: color, label: label};
    });

    const processedEdges = relevantEdges.map(edge => {
      const weight = edge.weight || 1;
      const size = Math.max(1, Math.min(4, Math.round(weight * 2)));
      return { ...edge, size };
    });

    return { filteredNodes: processedNodes, filteredEdges: processedEdges };
  }, [selectedThreat, safeNodes, safeEdges]);

  // <-- MODIFIED: This effect now controls the loading state -->
  useEffect(() => {
    if (!hasMounted || filteredNodes.length === 0) {
      setIsGraphLoading(false);
      return;
    }

    setIsGraphLoading(true);

    const timer = setTimeout(() => {
      try {
        if (graphRef.current) {
          graphRef.current.fitNodesInView();
        }
      } catch (error) {
        console.warn('Failed to fit nodes in view:', error);
      } finally {
        setIsGraphLoading(false);
      }
    }, 500); // Using the more stable 500ms timeout

    return () => clearTimeout(timer);
  }, [hasMounted, selectedThreat, refreshKey, filteredNodes.length]); // Dependencies trigger on change or refresh

  const handleEdgeClick = useCallback((edge: Edge) => {
    setSelectedEdge(current => (current && current.id === edge.id ? null : edge));
  }, []);
  
  // <-- NEW: Handler for the manual refresh button -->
  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // --- (Initial loading placeholder remains unchanged) ---
  if (!hasMounted || nodes.length === 0) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-center">
          <div className="w-80">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div style={{ width: '100%', height: '600px', position: 'relative' }}>
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Laden van netwerkvisualisatie...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* --- (Select dropdown remains unchanged) --- */}
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
      
      {/* <-- MODIFIED: Graph container now includes loading overlay and refresh button --> */}
      <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div ref={containerRef} style={{ width: '100%', height: '600px', position: 'relative' }}>
          {filteredNodes.length > 0 ? (
            <>
              <GraphCanvas
                key={`${selectedThreat}-${refreshKey}`} // <-- MODIFIED: Key now includes refresh trigger
                ref={graphRef}
                nodes={filteredNodes}
                edges={filteredEdges}
                theme={theme}
                cameraMode="rotate"
                layoutType="hierarchicalLr"
                onEdgeClick={handleEdgeClick as any}
              />
              
              {/* <-- NEW: Loading Indicator Overlay --> */}
              {isGraphLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-opacity">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                  <p className="mt-4 text-gray-700 font-medium">Visualisatie opbouwen...</p>
                </div>
              )}

              {/* <-- NEW: Manual Refresh Button --> */}
              <button
                onClick={handleRefresh}
                className="absolute top-3 right-3 z-20 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 active:scale-95 transition-all"
                title="Herlaad visualisatie"
                aria-label="Herlaad visualisatie"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
              </button>
            </>
          ) : (
             <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Geen data om te visualiseren voor deze selectie.</div>
            </div>
          )}
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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListOrdered, ArrowBigRight, BookText, Move, ShieldAlert, HelpCircle } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from 'react';
import GraphChart, { GraphChartRef } from './GraphChart';
import NodeSelector from './NodeSelector';
import ColorLegend from './ColorLegend';
import { EdgeDisplayMode } from './EdgeDisplayToggle';
import type { Node, Edge } from './networkGraph/networkService';
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import ThreatTable from './ThreatTable';
// MODIFICATION: Imported longNodeDescriptions
import { shortNodeDescriptions, longNodeDescriptions, threatImpacts, sourceMapping } from './shortNodeDescriptions';
// Import the tutorial components
import TutorialOverlay, { useTutorial } from './TutorialOverlay';
// Import mobile detection hook
import { useWindowSize, MOBILE_BREAKPOINT } from '@/hooks/useWindowSize';

interface MainContentProps {
  nodes: Node[];
  loading: boolean;
  error: string | null;
  filteredNodes: Node[];
  filteredEdges: Edge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  edgeDisplayMode: EdgeDisplayMode;
  onSetEdgeDisplayMode: (mode: EdgeDisplayMode) => void;
}

export type CentralityMetric =
  'eigen_centrality' |
  'eigen_centrality_in' |
  'eigen_centrality_out' |
  'cross_category_eigen_centrality' |
  'cross_category_eigen_centrality_in' |
  'cross_category_eigen_centrality_out';

// Helper function to get the centrality value for a node
const getCentralityValue = (node: Node, metric: CentralityMetric): number | null => {
  return node.data?.[metric] ?? null;
};

/**
 * Helper function to determine the centrality tier.
 * - If value < 0.001: "Zeer laag"
 * - < 70th quantile: "Laag"
 * - < 80th quantile: "Gemiddeld"
 * - < 90th quantile: "Hoog"
 * - >= 90th quantile: "Zeer hoog"
 */
const getCentralityTier = (node: Node | null, allNodes: Node[]): string => {
  const metric: CentralityMetric = 'cross_category_eigen_centrality_out';
  if (!node) return "N.v.t.";

  const currentValue = getCentralityValue(node, metric);
  if (currentValue === null) return "N.v.t.";

  const allValues = allNodes
    .map(n => getCentralityValue(n, metric))
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);

  if (allValues.length === 0) return "N.v.t.";

  if (currentValue < 0.001) return "Zeer laag";

  // Helper to get quantile value
  const quantile = (arr: number[], q: number) => {
    const pos = (arr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (arr[base + 1] !== undefined) {
      return arr[base] + rest * (arr[base + 1] - arr[base]);
    } else {
      return arr[base];
    }
  };

  const q70 = quantile(allValues, 0.7);
  const q80 = quantile(allValues, 0.8);
  const q90 = quantile(allValues, 0.9);

  if (currentValue < q70) return "Laag";
  if (currentValue < q80) return "Gemiddeld";
  if (currentValue < q90) return "Hoog";
  return "Zeer hoog";
};

const getImpactLevel = (node: Node | null): string => {
  if (!node) return "N.v.t.";
  return threatImpacts[node.id] || "Onbekend";
};

export const MainContent = ({
  nodes,
  loading,
  error,
  filteredNodes,
  filteredEdges,
  selectedNodeId,
  onSelectNode,
}: MainContentProps) => {
  const graphRef = useRef<GraphChartRef>(null);

  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showRelationships] = useState<boolean>(false);
  const [showPanel, setShowPanel] = useState<boolean>(false);
  const [scoringMetric] = useState<CentralityMetric>('cross_category_eigen_centrality_out');
  const [minNodeSize] = useState<number>(5);
  const [maxNodeSize] = useState<number>(15);
  const [edgeWeightCutoff] = useState<number>(0.5);
  const [useWeightBasedEdgeSize] = useState<boolean>(true);
  
  // Add viewport height detection
  const [isCompactView, setIsCompactView] = useState<boolean>(false);
  
  // Add mobile detection
  const windowWidth = useWindowSize();
  const isMobile = windowWidth !== null && windowWidth < MOBILE_BREAKPOINT;

  // Initialize tutorial hook
  const {
    tutorialStep,
    startTutorial,
    nextTutorialStep,
    closeTutorial,
    autoAdvanceFromNodeSelection,
  } = useTutorial();

  const selectedNode = selectedNodeId
    ? nodes.find(n => n.id === selectedNodeId) || null
    : null;

  const sourceNodeForEdge = selectedEdge ? nodes.find(n => n.id === selectedEdge.source) : null;
  const targetNodeForEdge = selectedEdge ? nodes.find(n => n.id === selectedEdge.target) : null;

  // Check viewport height on mount and resize
  useEffect(() => {
    const checkViewportHeight = () => {
      setIsCompactView(window.innerHeight < 700);
    };
    
    checkViewportHeight();
    window.addEventListener('resize', checkViewportHeight);
    
    return () => window.removeEventListener('resize', checkViewportHeight);
  }, []);

  const handleNodeSelect = (nodeId: string | null) => {
    setSelectedEdge(null);
    onSelectNode(nodeId);
    if (nodeId && window.innerWidth < 768) {
      setShowPanel(true);
    }
    // Auto-advance tutorial when a node is selected during tutorial
    autoAdvanceFromNodeSelection(nodeId);
  };

  const handleEdgeSelect = (edge: Edge | null) => {
    onSelectNode(null);
    setSelectedEdge(edge);
    if (edge && window.innerWidth < 768) {
        setShowPanel(true);
    }
  };

  const sortedNodesForSelector = useMemo(() => {
    return [...filteredNodes]
      .map(node => ({
        ...node,
        displayLabel: shortNodeDescriptions[node.id] || node.label,
      }))
      .sort((a, b) => {
        const valA = getCentralityValue(a, scoringMetric);
        const valB = getCentralityValue(b, scoringMetric);
        const scoreA = valA === null ? -Infinity : valA;
        const scoreB = valB === null ? -Infinity : valB;
        return scoreB - scoreA;
      });
  }, [filteredNodes, scoringMetric]);

  useEffect(() => {
    if (selectedNodeId && graphRef.current) {
      graphRef.current.centerOnNode(selectedNodeId);
    }
  }, [selectedNodeId]);

  const formatDocumentLink = (link: string): string => {
    if (link && link.startsWith('/')) {
      return `https://open.overheid.nl${link}`;
    }
    return link || '#';
  };

  const renderCitationParts = (citationText: string) => {
    if (!citationText.includes(" ||| ")) {
      return <div className={`italic bg-muted/40 rounded text-left ${isCompactView ? 'p-2 text-xs' : 'p-3 text-sm'}`}>"{citationText}"</div>;
    }
    const parts = citationText.split(" ||| ");
    return (
      <div className={isCompactView ? "space-y-1" : "space-y-2"}>
        {parts.map((part, i) => (
          <div key={i} className={`italic bg-muted/40 rounded text-left ${isCompactView ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
            "{part.trim()}"
          </div>
        ))}
      </div>
    );
  };

  return (
  <div className="relative w-full h-full">
      {/* Graph Container - Add ID for tutorial targeting */}
      <div id="graph-container" className="absolute inset-0 w-full h-full">
      <div
        id="graph-visual-area"
        className="absolute top-0 left-0 h-full w-full md:w-3/5 lg:w-2/3"
      />
      <GraphChart
        ref={graphRef}
        nodes={filteredNodes}
        edges={filteredEdges}
        loading={loading}
        error={error}
        selectedNodeId={selectedNodeId}
        selectedEdge={selectedEdge}
        onNodeSelect={handleNodeSelect}
        onEdgeClick={handleEdgeSelect}
        showRelationships={showRelationships}
        sizingAttribute={scoringMetric}
        minNodeSize={minNodeSize}
        maxNodeSize={maxNodeSize}
        edgeWeightCutoff={edgeWeightCutoff}
        useWeightBasedEdgeSize={useWeightBasedEdgeSize}
        shortNodeDescriptions={shortNodeDescriptions}
      />
      </div>

      <div className="absolute bottom-10 left-10 z-10">
        <ColorLegend />
      </div>

      {/* Top controls with Tutorial button - Hide on mobile */}
      {!isMobile && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-2">
          <div className="bg-background/70 backdrop-blur-md p-2 rounded-lg shadow-lg">
            <Sheet>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 px-3" disabled={loading || !!error || nodes.length === 0}>
                        <ListOrdered className="h-4 w-4" />
                        <span>Centraliteitswaarden</span>
                      </Button>
                    </SheetTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bekijk exacte centraliteitswaarden</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <SheetContent side="bottom" className="h-[75vh] flex flex-col p-0">
                <ThreatTable nodes={nodes} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Tutorial Button */}
          <div className="bg-background/70 backdrop-blur-md p-2 rounded-lg shadow-lg">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 px-3"
                    onClick={startTutorial}
                    disabled={loading || !!error || nodes.length === 0}
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Gids</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Start interactieve gids</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

       {edgeWeightCutoff > 0.5 && (
         <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
           <div className="bg-background/70 backdrop-blur-md px-3 py-1 rounded-lg shadow-lg text-xs">
             <span className="text-muted-foreground">Filteren: </span>
             <span>Alleen verbindingen met gewicht ≥ {edgeWeightCutoff.toFixed(2)} worden getoond</span>
           </div>
         </div>
       )}
      <div className="md:hidden absolute top-4 right-4 z-10">
        <Button variant="secondary" className="bg-background/70 backdrop-blur-md shadow-lg" onClick={() => setShowPanel(!showPanel)}>
          {showPanel ? "Verberg Paneel" : "Toon Paneel"}
        </Button>
      </div>

      <div className={`absolute right-0 top-0 bottom-0 z-10 w-full md:w-2/5 lg:w-1/3 transform transition-transform duration-300 ease-in-out ${
        showPanel || window.innerWidth >= 768 ? 'translate-x-0' : 'translate-x-full'
      } ${ window.innerWidth >= 768 ? 'md:translate-x-0' : '' }`}>
        <Card className="h-full bg-background/60 backdrop-blur-md border-0 shadow-lg rounded-l-lg rounded-r-none overflow-hidden">
          <div className={`flex flex-col h-full ${isCompactView ? 'p-2' : 'p-4'}`}>
            <div className={`${isCompactView ? 'mb-2 pt-1' : 'mb-4 pt-2'}`}>
              <h4 className={`font-medium ${isCompactView ? 'text-xs mb-1' : 'text-sm mb-2'}`}>Selecteer Dreiging</h4>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  {/* Add ID for tutorial targeting */}
                  <div id="node-selector">
                    <NodeSelector
                      nodes={sortedNodesForSelector}
                      selectedNodeId={selectedNodeId}
                      onSelectNode={handleNodeSelect}
                      placeholder="Selecteer een dreiging..."
                    />
                  </div>
                </div>
              </div>
              <p className={`text-muted-foreground ${isCompactView ? 'text-[10px] mt-0.5' : 'text-xs mt-1'}`}>
                Gesorteerd op centraliteit (hoogste eerst)
              </p>
            </div>

            <Separator className={`bg-border/30 ${isCompactView ? 'my-1' : 'my-2'}`} />

            <div className="flex-1 overflow-hidden flex flex-col">
              <h4 className={`font-medium ${isCompactView ? 'text-xs mb-1' : 'text-sm mb-3'}`}>
                  {selectedNode ? "Geselecteerde Dreiging" : selectedEdge ? "Geselecteerde Verbinding" : "Details"}
              </h4>

              {!selectedNode && !selectedEdge && (
                <div className={`text-muted-foreground bg-muted/30 rounded-lg ${isCompactView ? 'text-xs p-2' : 'text-sm p-4'}`}>
                  Klik op een dreiging of verbinding in de grafiek om details te bekijken.
                </div>
              )}

              {selectedNode && (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="flex-shrink-0">
                    {/* Add ID for tutorial targeting */}
                    <div id="centrality-info" className={`bg-muted/20 rounded-lg border border-border/20 ${isCompactView ? 'p-2' : 'p-4'}`}>
                      {/* MODIFICATION: Adjusted margin and added long description */}
                      <p className={`font-semibold text-primary ${isCompactView ? 'text-sm mb-0.5' : 'text-lg mb-1'}`}>{shortNodeDescriptions[selectedNode.id] || selectedNode.label}</p>
                      <p className={`text-muted-foreground ${isCompactView ? 'text-xs mb-2' : 'text-sm mb-4'}`}>
                        <strong>Volledige naam:</strong> {longNodeDescriptions[selectedNode.id] || selectedNode.id}
                      </p>

                      <div className={`grid grid-cols-1 md:grid-cols-2 text-sm ${isCompactView ? 'gap-2' : 'gap-3'}`}>
                        <div className={`bg-background/50 rounded-md flex items-center gap-3 ${isCompactView ? 'p-2' : 'p-3'}`}>
                          <Move className={`text-muted-foreground ${isCompactView ? 'h-4 w-4' : 'h-5 w-5'}`} />
                          <div>
                            <span className={`text-muted-foreground ${isCompactView ? 'text-xs' : ''}`}>Centraliteit</span>
                            <p className={`font-bold text-foreground ${isCompactView ? 'text-xs' : 'text-sm'}`}>{getCentralityTier(selectedNode, nodes)}</p>
                          </div>
                        </div>

                        <div className={`bg-background/50 rounded-md flex items-center gap-3 ${isCompactView ? 'p-2' : 'p-3'}`}>
                          <ShieldAlert className={`text-muted-foreground ${isCompactView ? 'h-4 w-4' : 'h-5 w-5'}`} />
                          <div>
                            <span className={`text-muted-foreground ${isCompactView ? 'text-xs' : ''}`}>Impact</span>
                            <p className={`font-semibold text-foreground ${isCompactView ? 'text-xs' : 'text-sm'}`}>{getImpactLevel(selectedNode)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`flex-1 flex flex-col overflow-hidden ${isCompactView ? 'mt-2' : 'mt-4'}`}>
                    {/* Add ID for tutorial targeting */}
                    <div id="citations-container" className={`flex-1 flex flex-col overflow-hidden ${isCompactView ? 'mt-2' : 'mt-4'}`}>
                    <h5 className={`font-medium flex-shrink-0 ${isCompactView ? 'text-xs mb-1' : 'text-sm mb-2'}`}>Representatieve citaten</h5>
                    <div className={`flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg ${isCompactView ? 'mb-2' : 'mb-3'}`}>
                    <ShieldAlert className={`text-amber-600 flex-shrink-0 ${isCompactView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    <p className={`text-amber-700 ${isCompactView ? 'text-[10px]' : 'text-xs'}`}>
                      Door <a href="https://www.rijksoverheid.nl/documenten" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">overheidswerkzaamheden</a> zijn sommige onderliggende documenten tijdelijk niet beschikbaar.
                    </p>
                  </div>
                    <div className={`overflow-y-auto pr-2 flex-1 ${isCompactView ? 'space-y-2' : 'space-y-3'}`}>
                      {selectedNode.citaten && selectedNode.citaten.length > 0 ? (
                         selectedNode.citaten.map((citation, index) => (
                          <div key={index} className={`bg-background/50 rounded-lg border border-border/20 ${isCompactView ? 'p-2' : 'p-3'}`}>
                            <div className={`flex justify-between items-start ${isCompactView ? 'mb-1' : 'mb-2'}`}>
                              <a href={formatDocumentLink(citation.document_link)} target="_blank" rel="noopener noreferrer" className={`font-medium text-primary hover:underline flex-1 mr-2 ${isCompactView ? 'text-xs' : 'text-sm'}`}>
                                {citation.title || "Onbekende Titel"}
                              </a>
                            </div>
                          <div className={`flex flex-wrap text-muted-foreground space-x-2 text-left ${isCompactView ? 'text-[10px] mb-1' : 'text-xs mb-2'}`}>
                            {citation.publication_date && <div>{citation.publication_date.slice(0, 7)}</div>}
                            {citation.publication_date && (citation.document_type || citation.source) && <div>•</div>}
                            {citation.document_type && <div>{citation.document_type}</div>}
                            {citation.document_type && citation.source && <div>•</div>}
                            {citation.source && <div>{sourceMapping[citation.source] || citation.source}</div>}
                          </div>
                          {citation.citaat.split('|||').map((citaatPart, partIndex) => (
                            <div key={partIndex} className={`italic bg-muted/40 p-2 rounded text-left ${isCompactView ? 'text-xs mt-1' : 'text-sm mt-2'}`}>
                              "{citaatPart.trim()}"
                            </div>
                          ))}
                          </div>
                         ))
                      ) : (
                        <div className={`text-muted-foreground bg-muted/30 rounded-lg ${isCompactView ? 'text-xs p-2' : 'text-sm p-3'}`}>
                          Geen citaties beschikbaar voor deze dreiging.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </div>
              )}

              {selectedEdge && (
                <div className="flex flex-col h-full overflow-hidden">
                   <div className="flex-shrink-0">
                    <div className={`bg-muted/20 rounded-lg border border-border/20 ${isCompactView ? 'p-2' : 'p-4'}`}>
                      <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${isCompactView ? 'mb-2' : 'mb-4'}`}>
                          <span className={`font-semibold text-primary ${isCompactView ? 'text-sm' : 'text-lg'}`}>{shortNodeDescriptions[sourceNodeForEdge?.id || ''] || sourceNodeForEdge?.label || 'Onbekend'}</span>
                          <ArrowBigRight className={`text-muted-foreground flex-shrink-0 ${isCompactView ? 'h-4 w-4' : 'h-5 w-5'}`} />
                          <span className={`font-semibold text-primary ${isCompactView ? 'text-sm' : 'text-lg'}`}>{shortNodeDescriptions[targetNodeForEdge?.id || ''] || targetNodeForEdge?.label || 'Onbekend'}</span>
                      </div>
                      
                      <div className={`grid grid-cols-1 md:grid-cols-2 text-sm ${isCompactView ? 'gap-2' : 'gap-3'}`}>
                        <div className={`bg-background/50 rounded-md flex items-center gap-3 ${isCompactView ? 'p-2' : 'p-3'}`}>
                          <BookText className={`text-muted-foreground ${isCompactView ? 'h-4 w-4' : 'h-5 w-5'}`} />
                          <div>
                            <span className={`text-muted-foreground ${isCompactView ? 'text-xs' : ''}`}>Gevonden citaten</span>
                            <p className={`font-bold text-foreground ${isCompactView ? 'text-xs' : 'text-sm'}`}>{selectedEdge.raw_count || 0}</p>
                          </div>
                        </div>

                        <div className={`bg-background/50 rounded-md flex items-center gap-3 ${isCompactView ? 'p-2' : 'p-3'}`}>
                          <ShieldAlert className={`text-muted-foreground ${isCompactView ? 'h-4 w-4' : 'h-5 w-5'}`} />
                          <div>
                            <span className={`text-muted-foreground ${isCompactView ? 'text-xs' : ''}`}>Impact van Gevolg</span>
                            <p className={`font-semibold text-foreground ${isCompactView ? 'text-xs' : 'text-sm'}`}>{getImpactLevel(targetNodeForEdge as any)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`flex-1 flex flex-col overflow-hidden ${isCompactView ? 'mt-2' : 'mt-4'}`}>
                    <h5 className={`font-medium flex-shrink-0 ${isCompactView ? 'text-xs mb-1' : 'text-sm mb-2'}`}>Representatieve citaten</h5>
                    <div className={`flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg ${isCompactView ? 'mb-2' : 'mb-3'}`}>
                    <ShieldAlert className={`text-amber-600 flex-shrink-0 ${isCompactView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    <p className={`text-amber-700 ${isCompactView ? 'text-[10px]' : 'text-xs'}`}>
                      Door <a href="https://www.rijksoverheid.nl/documenten" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">overheidswerkzaamheden</a> zijn sommige onderliggende documenten tijdelijk niet beschikbaar.
                    </p>
                  </div>
                     <div className={`overflow-y-auto pr-2 flex-1 ${isCompactView ? 'space-y-2' : 'space-y-3'}`}>
                      {selectedEdge.citaat_relaties && selectedEdge.citaat_relaties.length > 0 ? (
                        selectedEdge.citaat_relaties.map((citation, index) => (
                           <div key={index} className={`bg-background/50 rounded-lg border border-border/20 ${isCompactView ? 'p-2' : 'p-4'}`}>
                            <div className={`flex justify-between items-start ${isCompactView ? 'mb-1' : 'mb-2'}`}>
                              <a href={formatDocumentLink(citation.document_link)} target="_blank" rel="noopener noreferrer" className={`font-medium text-primary hover:underline flex-1 mr-2 ${isCompactView ? 'text-xs' : 'text-sm'}`}>
                                {citation.title || "Onbekende Titel"}
                              </a>
                            </div>
                            <div className={`flex flex-wrap text-muted-foreground space-x-2 ${isCompactView ? 'text-[10px] mb-2' : 'text-xs mb-3'}`}>
                              {citation.publication_date && <div>{citation.publication_date.slice(0, 7)}</div>}
                              {citation.publication_date && (citation.source) && <div>•</div>}
                              {citation.source && <div>{sourceMapping[citation.source] || citation.source}</div>}
                            </div>
                            <div className={isCompactView ? 'text-xs mt-1' : 'text-sm mt-2'}>
                            <div className={`flex gap-2 ${isCompactView ? 'mb-0.5' : 'mb-1'}`}>
                              <span className={`font-medium bg-primary/10 px-2 py-0.5 rounded w-16 flex-shrink-0 ${isCompactView ? 'text-[10px]' : 'text-xs'}`}>Oorzaak</span>
                              <span className="text-left flex-1">{citation.oorzaak}</span>
                            </div>
                            <div className={`flex gap-2 ${isCompactView ? 'mb-1' : 'mb-3'}`}>
                              <span className={`font-medium bg-primary/10 px-2 py-0.5 rounded w-16 flex-shrink-0 ${isCompactView ? 'text-[10px]' : 'text-xs'}`}>Gevolg</span>
                              <span className="text-left flex-1">{citation.gevolg}</span>
                            </div>
                              {renderCitationParts(citation.citaat)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={`text-muted-foreground bg-muted/30 rounded-lg ${isCompactView ? 'text-xs p-2' : 'text-sm p-3'}`}>
                          Geen citaties beschikbaar voor deze verbinding.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`md:hidden ${isCompactView ? 'mt-2' : 'mt-4'}`}>
              <Button variant="outline" className="w-full" onClick={() => setShowPanel(false)}>
                Sluit Paneel
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Tutorial Overlay Component */}
      <TutorialOverlay
        step={tutorialStep}
        onNext={nextTutorialStep}
        onClose={closeTutorial}
        selectedNodeId={selectedNodeId}
      />
    </div>
  );
};

export default MainContent;
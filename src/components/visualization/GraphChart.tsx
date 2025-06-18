import { GraphCanvas, GraphCanvasRef, useSelection, lightTheme } from 'reagraph';
import { useRef, useImperativeHandle, forwardRef, useEffect, useMemo, useCallback } from 'react';
import { Node as CustomNode, Edge } from './networkGraph/networkService';

// Define the structure for position data
interface NodePositionData {
  id: string;
  x: number;
  y: number;
  z?: number; // Optional z-coordinate
}

// This static data could also be moved to its own file if it grows
const POSITIONS: NodePositionData[] = [
    { "id": "sabotage van onderzeese infrastructuur (zoals internetkabels)", "x": 145.85717491406618, "y": 90.7768099096383 },
    { "id": "(heimelijke) beïnvloeding en hybride operaties door statelijke actoren die aangrijpen op het maatschappelijk debat", "x": -87.5619038258964, "y": 95.16593310426349 },
    { "id": "polarisatie rond complottheorieën", "x": 10.701064529207207, "y": -120.06256400878351 },
    { "id": "cyberaanvallen kritieke infrastructuur", "x": 72.88499182795246, "y": 5.62986263339071 },
    { "id": "hitte/droogte", "x": 99.95570320523177, "y": 173.86891144621757 },
    { "id": "overstroming zee", "x": 153.71942972387606, "y": 185.23568097060993 },
    { "id": "klassieke statelijke spionage", "x": -56.70544737067851, "y": 147.7415744131209 },
    { "id": "innovatie nucleaire overbrengingsmiddelen", "x": -164.27651042543525, "y": 113.45169010847208 },
    { "id": "criminele inmenging bedrijfsleven", "x": -0.7199545599589199, "y": -259.8366420158179 },
    { "id": "infiltratie openbaar bestuur", "x": -70.15901648436072, "y": -232.89925254492906 },
    { "id": "georganiseerde criminaliteit door heel nederland", "x": -25.965640411392624, "y": -228.76313945998095 },
    { "id": "ondermijnende enclaves", "x": 45.891685485684455, "y": -230.23958452882525 },
    { "id": "strategische afhankelijkheden grondstoffen en technologie van buitenlande leveranciers", "x": -122.20036107954402, "y": -34.170662847366415 },
    { "id": "crisis in de zuid-chinese zee", "x": -145.42048902658632, "y": 162.44140113422205 },
    { "id": "tekorten essentiële grondstoffen", "x": -144.8954835890368, "y": -69.5655127482634 },
    { "id": "tweespalt in de eu", "x": -129.2570481667928, "y": 129.96350656014764 },
    { "id": "verstoring van handel door productieproblemen buitenland", "x": -160.1298615427663, "y": -30.89450421181169 },
    { "id": "uiteenvallen van de navo", "x": -98.82038843127559, "y": 188.67618105533776 },
    { "id": "tijdelijke bezetting van een eu-lidstaat", "x": -94.58000251664477, "y": 149.451059062847 },
    { "id": "onzekerheid energievoorziening", "x": -201.01501857716744, "y": -34.75012096603913 },
    { "id": "crimineel geweld richting media en overheid", "x": -11.695908510810677, "y": -184.08306998954797 },
    { "id": "anti-overheidsextremisme", "x": 58.850329914180456, "y": -161.18629248862266 },
    { "id": "meervoudige terroristische aanslag", "x": 23.222733670378382, "y": -163.71282156143448 },
    { "id": "handelsoorlog waar de eu bij betrokken is", "x": -141.21064459171927, "y": 5.546558238239806 },
    { "id": "europese schuldencrisis", "x": -224.98127007553737, "y": -71.30961357268146 },
    { "id": "overstroming rivier", "x": 72.80308542434192, "y": 211.62559348279473 },
    { "id": "tekort aan drinkwater door verzilting en vervuiling", "x": 125.90409074160539, "y": 230.46406033644962 },
    { "id": "verarming biodiversiteit met effecten op voedselzekerheid", "x": 97.38518514949429, "y": 253.17522564020334 },
    { "id": "gebruik van generatieve ai voor deepfakes en desinformatie", "x": 126.13394933879192, "y": 65.55178318706515 },
    { "id": "chinese hereniging taiwan", "x": -199.72201092747636, "y": 170.93328253871215 },
    { "id": "cyberspionage overheid", "x": 47.397560136030556, "y": 62.5465911958669 },
    { "id": "ongewenste buitenlandse inmenging in diasporagemeenschappen", "x": -45.05602828897287, "y": -124.45098353366845 },
    { "id": "keteneffecten elektriciteitsuitval", "x": 108.9736718655655, "y": 28.939165074164983 },
    { "id": "ransomware telecom", "x": 149.7321971464448, "y": 26.685018558792642 },
    { "id": "verstoring van het betalingsverkeer", "x": -187.06082019782642, "y": -3.445513203483574 },
    { "id": "pandemie door een mens overdraagbaar virus", "x": 168.0657841211215, "y": -127.17851342023174 },
    { "id": "natuurbranden", "x": 162.11590866870102, "y": 225.79094700387077 },
    { "id": "geweldsescalatie rechtsextremisten", "x": 22.284922148986638, "y": -205.15263854537778 },
    { "id": "alleenhandelende dader", "x": -45.443607079948734, "y": -165.54446874670415 },
    { "id": "staatlijke verwerving van een belang in grote telecom-aanbieder", "x": -237.45594499101932, "y": 8.276535149192766 },
    { "id": "landelijke black-out", "x": 87.37665525848925, "y": 76.3039655455592 },
    { "id": "stralingsongeval in europa", "x": 208.14220997951097, "y": 0.6221272794446553 },
    { "id": "collateral damage", "x": -140.96449230465905, "y": 223.48965894367916 },
    { "id": "systeempartij in de financiële sector in zwaar weer", "x": -170.9161068120637, "y": -91.24379694467102 },
    { "id": "correctie op waardering financiële activa", "x": -206.20121146696246, "y": -111.17216297952578 },
    { "id": "aanval cloud service provider", "x": 140.21220563908517, "y": -14.836825767464969 },
    { "id": "ransomware zorgsector", "x": 101.85554207724238, "y": -26.382891169813394 },
    { "id": "geïnduceerde aardbeving", "x": 45.4473871383473, "y": 252.79037680228774 },
    { "id": "kerncentrale borssele", "x": 222.57472260576787, "y": 48.78647142656096 },
    { "id": "anarcho-extremisme", "x": -86.14518893574973, "y": -193.89167752028743 },
    { "id": "uitbraak zoönotische variant vogelgriep", "x": 194.27334433239207, "y": -174.46360518288765 },
    { "id": "uitbraak mkz onder koeien", "x": 240.21862817155412, "y": -154.16320405219432 },
    { "id": "griep pandemie", "x": 225.7315084974734, "y": -115.39538284556113 }
];


const exampleCategorySpreadConfiguration: CategorySpreadConfig = {
  'Sociaal & Maatschappelijk': {
    xSpreadMultiplier: 1.6, ySpreadMultiplier: 1.3, anchorNodeId: "polarisatie rond complottheorieën", translateX: 30,
  },
  'Economisch': {
    xSpreadMultiplier: 2, ySpreadMultiplier: 1.2, translateY: -50, translateX: 10,
  },
  'Geopolitiek & militair': {
    xSpreadMultiplier: 1.4, ySpreadMultiplier: 1.3, anchorNodeId: "(heimelijke) beïnvloeding en hybride operaties door statelijke actoren die aangrijpen op het maatschappelijk debat", translateX: -70
  },
  'Technologisch & digitaal': {
    xSpreadMultiplier: 1.25, ySpreadMultiplier: 1.25, translateY: -30,
  },
  'Ecologisch': {
    anchorNodeId: "hitte/droogte", ySpreadMultiplier: 1.3, xSpreadMultiplier: 1.3, translateX: -50, translateY: 60,
  },
  'Gezondheid': {
    xSpreadMultiplier: 1.5, ySpreadMultiplier: 1.2, anchorNodeId: "pandemie door een mens overdraagbaar virus", translateX: 60, translateY: 50,
  },
  'unknown': {
    xSpreadMultiplier: 1.05, ySpreadMultiplier: 1.05,
  }
};

export const categoryColors: Record<string, string> = {
  'Sociaal & Maatschappelijk': '#0699a9',
  'Economisch': '#702f8e',
  'Ecologisch': '#84b440',
  'Geopolitiek & militair': '#a8aaad',
  'Technologisch & digitaal': '#abccd5',
  'Gezondheid': '#e42259'
};

const denkWerkTheme = {
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

export interface CategorySpreadConfig {
  [categoryName: string]: {
    xSpreadMultiplier?: number;
    ySpreadMultiplier?: number;
    anchorNodeId?: string;
    translateX?: number;
    translateY?: number;
  };
}

interface GraphChartProps {
  nodes: CustomNode[];
  edges: Edge[];
  loading?: boolean;
  error?: string | null;
  selectedNodeId: string | null;
  selectedEdge: Edge | null;
  shortNodeDescriptions: Record<string, string>;
  onNodeSelect: (nodeId: string | null) => void;
  onEdgeClick?: (edge: Edge | null) => void;
  showRelationships?: boolean;
  sizingAttribute?: 'eigen_centrality' | 'eigen_centrality_in' | 'eigen_centrality_out' | 'cross_category_eigen_centrality' | 'cross_category_eigen_centrality_in' | 'cross_category_eigen_centrality_out' | 'hub';
  minNodeSize?: number;
  maxNodeSize?: number;
  edgeWeightCutoff?: number;
  useWeightBasedEdgeSize?: boolean;
  clusterOnCategory?: boolean;
  rotationAngleDegrees?: number;
  categorySpreadConfig?: CategorySpreadConfig;
}

export interface GraphChartRef {
  centerOnNode: (nodeId: string) => void;
  fitAllNodesInView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetCamera: () => void;
}

const calculateGraphCenter = (positions: NodePositionData[]): { centerX: number, centerY: number } | null => {
  if (!positions || positions.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  positions.forEach(p => {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  });
  if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) return null;
  return { centerX: minX + (maxX - minX) / 2, centerY: minY + (maxY - minY) / 2 };
};

const graphCenter = calculateGraphCenter(POSITIONS);

const GraphChart = forwardRef<GraphChartRef, GraphChartProps>(
  ({
    nodes,
    edges,
    loading,
    error,
    selectedNodeId,
    selectedEdge,
    shortNodeDescriptions,
    onNodeSelect,
    onEdgeClick,
    showRelationships = false,
    sizingAttribute = 'hub',
    minNodeSize = 5,
    maxNodeSize = 15,
    edgeWeightCutoff = 0.5,
    useWeightBasedEdgeSize = false,
    rotationAngleDegrees = 78,
    categorySpreadConfig = exampleCategorySpreadConfiguration,
  }, ref) => {
    const graphRef = useRef<GraphCanvasRef>(null);

    const processedNodes = useMemo(() => {
      return nodes
        .filter(node => node.category)
        .map(node => {
          const category = node.category || 'unknown';
          const color = categoryColors[category] || categoryColors.unknown;
          const displayLabel = shortNodeDescriptions[node.id] || node.label || node.id;
          return { ...node, label: displayLabel, fill: color, color: color, data: { ...(node.data || {}), category: category } };
        });
    }, [nodes, shortNodeDescriptions]);

    const filteredNodeIds = useMemo(() => new Set(processedNodes.map(node => node.id)), [processedNodes]);

    const finalNodePositions = useMemo(() => {
      const nodesToProcessForPositioning = nodes.filter(node => node.category);

      if (!graphCenter) {
          const fallbackPositions = new Map<string, { x: number; y: number; z?: number }>();
          nodesToProcessForPositioning.forEach((appNode, index) => {
              const positionData = POSITIONS.find(p => p.id === appNode.id);
              if (positionData) {
                  fallbackPositions.set(appNode.id, { x: positionData.x, y: positionData.y, z: positionData.z || 0 });
              } else {
                  fallbackPositions.set(appNode.id, { x: (index % 10) * 100 - 500, y: Math.floor(index / 10) * 100 - 500, z: 0 });
              }
          });
          console.warn("Graph center could not be calculated. Spreading/translation might not be accurately applied.");
          return fallbackPositions;
      }

      const { centerX, centerY } = graphCenter;
      const angleRad = rotationAngleDegrees * (Math.PI / 180);
      const cosAngle = Math.cos(angleRad);
      const sinAngle = Math.sin(angleRad);

      const nodeDataMap = new Map<string, {
          id: string; category?: string; rotatedX: number; rotatedY: number; rotatedZ?: number;
      }>();

      nodesToProcessForPositioning.forEach((customNode, index) => {
          const positionInfo = POSITIONS.find(p => p.id === customNode.id);
          let ox, oy, oz;
          if (positionInfo) {
              ox = positionInfo.x; oy = positionInfo.y; oz = positionInfo.z;
          } else {
              console.warn(`Position data missing for node ${customNode.id}, applying fallback.`);
              ox = (index % 10) * 1000 + 10000; oy = Math.floor(index / 10) * 1000 + 10000; oz = 0;
          }
          const translatedX = ox - centerX; const translatedY = oy - centerY;
          const rotatedX = translatedX * cosAngle - translatedY * sinAngle + centerX;
          const rotatedY = translatedX * sinAngle + translatedY * cosAngle + centerY;
          nodeDataMap.set(customNode.id, {
              id: customNode.id, category: customNode.category, rotatedX: rotatedX, rotatedY: rotatedY, rotatedZ: oz || 0,
          });
      });

      const newPositions = new Map<string, { x: number; y: number; z?: number }>();
      nodeDataMap.forEach(data => newPositions.set(data.id, { x: data.rotatedX, y: data.rotatedY, z: data.rotatedZ }));

      Object.entries(categorySpreadConfig).forEach(([categoryName, config]) => {
        const { xSpreadMultiplier = 1.0, ySpreadMultiplier = 1.0, anchorNodeId, translateX = 0, translateY = 0 } = config;
        const categoryNodesData = Array.from(nodeDataMap.values()).filter(node => node.category === categoryName);
        if (categoryNodesData.length === 0) return;

        let referenceX: number, referenceY: number;
        let explicitAnchorData = anchorNodeId ? nodeDataMap.get(anchorNodeId) : undefined;

        if (explicitAnchorData && !filteredNodeIds.has(explicitAnchorData.id)) {
            explicitAnchorData = undefined;
        }

        if (explicitAnchorData && explicitAnchorData.category === categoryName) {
            referenceX = explicitAnchorData.rotatedX; referenceY = explicitAnchorData.rotatedY;
        } else {
            let sumX = 0, sumY = 0;
            categoryNodesData.forEach(node => { sumX += node.rotatedX; sumY += node.rotatedY; });
            referenceX = sumX / categoryNodesData.length; referenceY = sumY / categoryNodesData.length;
            explicitAnchorData = undefined;
        }

        categoryNodesData.forEach(currentNodeData => {
          if (!filteredNodeIds.has(currentNodeData.id)) return;
          let postSpreadX: number, postSpreadY: number;
          if (explicitAnchorData && currentNodeData.id === explicitAnchorData.id) {
            postSpreadX = currentNodeData.rotatedX; postSpreadY = currentNodeData.rotatedY;
          } else {
            const vectorX = currentNodeData.rotatedX - referenceX; const vectorY = currentNodeData.rotatedY - referenceY;
            const scaledVectorX = vectorX * xSpreadMultiplier; const scaledVectorY = vectorY * ySpreadMultiplier;
            postSpreadX = referenceX + scaledVectorX; postSpreadY = referenceY + scaledVectorY;
          }
          newPositions.set(currentNodeData.id, {
            x: postSpreadX + translateX, y: postSpreadY + translateY, z: currentNodeData.rotatedZ,
          });
        });
      });
      return newPositions;
    }, [nodes, rotationAngleDegrees, categorySpreadConfig, filteredNodeIds]);

    const getNodePositionCallback = useCallback((nodeId: string): { x: number; y: number; z?: number } => {
        const precalculatedPos = finalNodePositions.get(nodeId);
        if (precalculatedPos) return precalculatedPos;
        if (filteredNodeIds.has(nodeId)) {
            console.warn(`Position for filtered node ID "${nodeId}" not found. Applying fallback.`);
            const originalNodeIndex = nodes.findIndex(n => n.id === nodeId);
             return originalNodeIndex !== -1
                ? { x: (originalNodeIndex % 10) * 150 - 750, y: Math.floor(originalNodeIndex / 10) * 150 - 750, z: 0 }
                : { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100, z: 0 };
        }
        console.warn(`Position requested for filtered-out node ID "${nodeId}".`);
        return { x: 0, y: 0, z: 0 };
    }, [finalNodePositions, nodes, filteredNodeIds]);

    const layoutOverrides: any = useMemo(() => ({
        getNodePosition: getNodePositionCallback
    }), [getNodePositionCallback]);

    const processedEdges = useMemo(() => {
      if (edges.length === 0) return [];

      const filteredEdges = edges.filter(edge =>
        filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
      );

      if (filteredEdges.length === 0) return [];

      const weights = filteredEdges.map(edge => edge.weight).filter(w => typeof w === 'number') as number[];
      if (weights.length === 0 && useWeightBasedEdgeSize) {
        return filteredEdges.map(edge => ({ ...edge, size: 1, normalizedWeight: 1 }));
      }

      const minWeight = Math.min(...weights, 0);
      const maxWeight = Math.max(...weights, 1);
      const scaleFactor = maxWeight === minWeight ? 0 : 2 / (maxWeight - minWeight);

      return filteredEdges
        .filter(edge => (edge.weight || 0) >= edgeWeightCutoff)
        .map(edge => {
          const currentWeight = edge.weight || 0;
          const normalizedWeight = (weights.length > 0 && maxWeight > minWeight)
            ? Math.round(1 + (currentWeight - minWeight) * scaleFactor)
            : 1;
          return { ...edge, size: useWeightBasedEdgeSize ? Math.max(1, normalizedWeight) : 1, normalizedWeight };
        });
    }, [edges, edgeWeightCutoff, useWeightBasedEdgeSize, filteredNodeIds]);

    const { selections, actives, clearSelections, setSelections } = useSelection({
      ref: graphRef,
      nodes: processedNodes,
      edges: processedEdges,
      pathSelectionType: showRelationships ? 'all' : 'direct',
      selections: selectedNodeId ? [selectedNodeId] : (selectedEdge ? [selectedEdge.id] : []),
    });

    const processedEdgeIds = useMemo(() => new Set(processedEdges.map(edge => edge.id)), [processedEdges]);

    useEffect(() => {
      if (selectedNodeId && filteredNodeIds.has(selectedNodeId) && !selections.includes(selectedNodeId)) {
        setSelections([selectedNodeId]);
      } else if (!selectedNodeId && !selectedEdge && selections.length > 0) {
        clearSelections();
      } else if (selectedNodeId && !filteredNodeIds.has(selectedNodeId) && selections.includes(selectedNodeId)) {
        clearSelections();
        onNodeSelect(null);
      }
    }, [selectedNodeId, selectedEdge, selections, clearSelections, setSelections, filteredNodeIds, onNodeSelect]);

    useEffect(() => {
      if (selectedEdge && processedEdgeIds.has(selectedEdge.id) && !selections.includes(selectedEdge.id)) {
        setSelections([selectedEdge.id]);
      } else if (!selectedEdge && !selectedNodeId && selections.length > 0) {
        clearSelections();
      } else if (selectedEdge && !processedEdgeIds.has(selectedEdge.id) && selections.includes(selectedEdge.id)) {
        clearSelections();
        if (onEdgeClick) onEdgeClick(null);
      }
    }, [selectedEdge, selectedNodeId, selections, clearSelections, setSelections, processedEdgeIds, onEdgeClick]);


  useEffect(() => {
    // A function to apply the desired camera transformation.
    const applyInitialCameraTransform = () => {
      if (graphRef.current) {

        const controls = graphRef.current.getControls();
        if (controls && controls.pan) {
          // The pan operation is now more likely to be on the fully rendered graph.
          controls.pan(230, 0);
        }
        graphRef.current.zoomOut();
      }
    };

    // The 100ms delay is a pragmatic choice, but for very complex graphs,
    // you might consider a slightly longer delay or a more sophisticated
    // check if the library provides any status flags.
    const timer = setTimeout(applyInitialCameraTransform, 1000);

    // Cleanup function to clear the timeout if the component unmounts
    // or if the dependencies change before the timeout completes.
    return () => clearTimeout(timer);
  }, [nodes, edges]); // This effect is correctly dependent on nodes and edges.
    
useImperativeHandle(ref, () => ({
    centerOnNode: (nodeId: string) => {
        if (graphRef.current) {
            const cameraControls = graphRef.current.getControls();
            graphRef.current.centerGraph([nodeId]);
            const isZoomLessThanOne = cameraControls.camera.zoom < 1;

            if (isZoomLessThanOne) {
                graphRef.current.zoomIn();
            }
        }
    },
    fitAllNodesInView: () => graphRef.current?.fitNodesInView(),
    zoomIn: () => graphRef.current?.zoomIn(),
    zoomOut: () => graphRef.current?.zoomOut(),
    resetCamera: () => graphRef.current?.resetControls()
}));

    const handleNodeClick = (node: CustomNode) => {
      if (onEdgeClick) onEdgeClick(null);
      onNodeSelect(node.id === selectedNodeId ? null : node.id);
    };

    const handleEdgeClick = (edge: Edge) => {
      onNodeSelect(null);
      if (onEdgeClick) {
        onEdgeClick(edge.id === selectedEdge?.id ? null : edge);
      }
    };

    const handleCanvasClick = () => {
      onNodeSelect(null);
      if (onEdgeClick){
        onEdgeClick(null);
      }
    };

    if (loading) return <div className="flex h-full items-center justify-center"><div className="animate-pulse text-gray-500">Loading graph data...</div></div>;
    if (error) return <div className="flex h-full items-center justify-center"><div className="text-red-500">Error loading graph: {error}</div></div>;

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <GraphCanvas
          edgeInterpolation="curved"
          ref={graphRef}
          nodes={processedNodes}
          edges={processedEdges}
          selections={selections}
          actives={actives}
          onNodeClick={handleNodeClick as any}
          onEdgeClick={onEdgeClick ? handleEdgeClick : undefined as any}
          onCanvasClick={handleCanvasClick}
          sizingType="attribute"
          sizingAttribute={sizingAttribute}
          theme={denkWerkTheme}
          minNodeSize={minNodeSize}
          maxNodeSize={maxNodeSize}
          layoutType="custom"
          layoutOverrides={layoutOverrides}
          labelType='nodes'
          // maxDistance={5000}
        />
      </div>
    );
  }
);

GraphChart.displayName = 'GraphChart';
export default GraphChart;
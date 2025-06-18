// src/components/GraphCanvas.tsx

import React, { useMemo } from 'react';
import { EdgeLine } from './EdgeLine';
import { HierarchicalLayout } from './HierarchicalLayout';

// --- Interfaces (unchanged) ---
export interface Node {
    id: string;
    label: string;
    fill?: string;
    [key: string]: any;
}
export interface Edge {
    id: string;
    source: string;
    target: string;
    size?: number;
    [key:string]: any;
}

// --- Prop Types (unchanged) ---
interface GraphCanvasProps {
    nodes: Node[];
    edges: Edge[];
    leftPadding?: number;
    rightPadding?: number;
}

// --- The SVG GraphCanvas Component ---
export const GraphCanvas: React.FC<GraphCanvasProps> = ({ 
    nodes, 
    edges, 
    leftPadding = 100, 
    rightPadding = 100 
}) => {
    const VIEWBOX_WIDTH = 800;
    const VIEWBOX_HEIGHT = 600;
    const NODE_RADIUS = 20;
    const ARROWHEAD_SIZE = 19; // Using a fixed pixel size for arrowheads

    const nodeMap = useMemo(() => {
        if (nodes.length === 0) return new Map();

        const layout = new HierarchicalLayout({
            width: VIEWBOX_WIDTH,
            height: VIEWBOX_HEIGHT,
            nodeRadius: NODE_RADIUS,
            horizontalSpacing: VIEWBOX_WIDTH * 0.3,
            verticalSpacing: 80,
            leftPadding,
            rightPadding
        });

        return layout.calculateLayout(nodes, edges);
    }, [nodes, edges, VIEWBOX_WIDTH, VIEWBOX_HEIGHT, NODE_RADIUS]);
    
    // Enhanced edge calculations with gradient information
    const edgeCalculations = useMemo(() => {
        return edges.map(edge => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);

            if (!source || !target) return null;

            const angle = Math.atan2(target.y - source.y, target.x - source.x);
            
            // Adjust endpoints to account for node radius and arrowhead size
            const arrowheadOffset = ARROWHEAD_SIZE / 2; // Half the marker size
            const sourceRadius = NODE_RADIUS;
            const targetRadius = NODE_RADIUS + arrowheadOffset;

            const x1 = source.x + sourceRadius * Math.cos(angle);
            const y1 = source.y + sourceRadius * Math.sin(angle);
            const x2 = target.x - targetRadius * Math.cos(angle);
            const y2 = target.y - targetRadius * Math.sin(angle);

            const sourceColor = source.node.fill || '#ccc';
            const targetColor = target.node.fill || '#ccc';
            // Create a valid SVG ID by removing invalid characters
            const gradientId = `gradient-${edge.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`;

            return {
                edge,
                x1, y1, x2, y2,
                sourceColor,
                targetColor,
                gradientId,
            };
        }).filter(e => e !== null); // Filter out any nulls
    }, [edges, nodeMap, NODE_RADIUS]);

    // Get unique target colors for arrowheads
    const uniqueTargetColors = useMemo(() => {
        const colors = new Set<string>();
        edgeCalculations.forEach(calc => {
            if (calc?.targetColor) {
                colors.add(calc.targetColor);
            }
        });
        return Array.from(colors);
    }, [edgeCalculations]);

    if (nodeMap.size === 0) {
        return null;
    }

    return (
        <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
        >
            <defs>
                {/* Linear gradient definitions for each edge */}
                {edgeCalculations.map(calc => {
                    if (!calc) return null;
                    return (
                        <linearGradient
                            key={calc.gradientId}
                            id={calc.gradientId}
                            x1={calc.x1}
                            y1={calc.y1}
                            x2={calc.x2}
                            y2={calc.y2}
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset="0%" stopColor={calc.sourceColor} />
                            <stop offset="100%" stopColor={calc.targetColor} />
                        </linearGradient>
                    );
                })}

                {/* Arrowhead marker definitions */}
                {uniqueTargetColors.map(color => (
                    <marker
                        key={color}
                        id={`arrowhead-${color.replace('#', '')}`}
                        viewBox="0 0 10 10"
                        refX="5" // Use center of marker as reference point
                        refY="5"
                        markerUnits="userSpaceOnUse" // Use pixels for size
                        markerWidth={ARROWHEAD_SIZE} // Smaller arrowhead
                        markerHeight={ARROWHEAD_SIZE} // Smaller arrowhead
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
                    </marker>
                ))}
            </defs>

            {/* Edges group with transparency */}
            <g opacity={0.5}>
                {edgeCalculations.map(calc => {
                    if (!calc) return null;
                    return (
                        <EdgeLine
                            key={calc.edge.id}
                            x1={calc.x1}
                            y1={calc.y1}
                            x2={calc.x2}
                            y2={calc.y2}
                            sourceColor={calc.sourceColor}
                            targetColor={calc.targetColor}
                            strokeWidth={5}
                            gradientId={calc.gradientId}
                        />
                    );
                })}
            </g>

            {/* Nodes group */}
            <g>
                {Array.from(nodeMap.values()).map(({ x, y, node }) => (
                    <g key={node.id} transform={`translate(${x}, ${y})`}>
                        <circle r={NODE_RADIUS} fill={node.fill || '#A9A9A9'} />
                        <text
                            y={NODE_RADIUS + 5}
                            textAnchor="middle"
                            dominantBaseline="hanging"
                            fill="#333"
                            fontSize="10px"
                            fontWeight="500"
                            stroke="white"
                            strokeWidth="0.4em"
                            paintOrder="stroke"
                            style={{ pointerEvents: 'none' }}
                        >
                            {node.label}
                        </text>
                    </g>
                ))}
            </g>
        </svg>
    );
};
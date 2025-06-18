// src/components/GraphCanvas.tsx

import React, { useMemo, useState } from 'react';
import { EdgeLine } from './EdgeLine';
import { HierarchicalLayout } from './HierarchicalLayout';

// FIX: Import the rich Node and Edge types from the parent component
// to ensure type compatibility.
import type { Node, Edge } from './RelationGraphCanvas';

// --- Prop Types ---
interface GraphCanvasProps {
    nodes: Node[];
    edges: Edge[];
    leftPadding?: number;
    rightPadding?: number;
    onEdgeClick?: (edge: Edge) => void;
    edgeHoverColor?: string;
}

// --- The SVG GraphCanvas Component ---
export const GraphCanvas: React.FC<GraphCanvasProps> = ({
    nodes,
    edges,
    leftPadding = 100,
    rightPadding = 100,
    onEdgeClick,
    edgeHoverColor = '#FF8C42', // Default orange
}) => {
    const VIEWBOX_WIDTH = 800;
    const VIEWBOX_HEIGHT = 600;
    const NODE_RADIUS = 20;
    const ARROWHEAD_SIZE = 15;

    const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

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
    }, [nodes, edges]);

    const edgeCalculations = useMemo(() => {
        return edges.map(edge => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);

            if (!source || !target) return null;

            const angle = Math.atan2(target.y - source.y, target.x - source.x);

            const arrowheadOffset = ARROWHEAD_SIZE / 2;
            const sourceRadius = NODE_RADIUS;
            const targetRadius = NODE_RADIUS + arrowheadOffset;

            const x1 = source.x + sourceRadius * Math.cos(angle);
            const y1 = source.y + sourceRadius * Math.sin(angle);
            const x2 = target.x - targetRadius * Math.cos(angle);
            const y2 = target.y - targetRadius * Math.sin(angle);

            const sourceColor = source.node.fill || '#ccc';
            const targetColor = target.node.fill || '#ccc';
            const gradientId = `gradient-${edge.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`;

            return {
                edge, x1, y1, x2, y2, sourceColor, targetColor, gradientId,
            };
        }).filter(e => e !== null);
    }, [edges, nodeMap]);

    const uniqueTargetColors = useMemo(() => {
        const colors = new Set<string>();
        edgeCalculations.forEach(calc => {
            if (calc?.targetColor) colors.add(calc.targetColor);
        });
        if (edgeHoverColor) colors.add(edgeHoverColor); // Ensure hover marker is created
        return Array.from(colors);
    }, [edgeCalculations, edgeHoverColor]);

    if (nodeMap.size === 0) return null;

    return (
        <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
        >
            <defs>
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

                {uniqueTargetColors.map(color => (
                    <marker
                        key={color}
                        id={`arrowhead-${color.replace('#', '')}`}
                        viewBox="0 0 10 10" refX="5" refY="5"
                        markerUnits="userSpaceOnUse"
                        markerWidth={ARROWHEAD_SIZE} markerHeight={ARROWHEAD_SIZE}
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
                    </marker>
                ))}
            </defs>

            <g>
                {edgeCalculations.map(calc => {
                    if (!calc) return null;

                    const isHovered = hoveredEdgeId === calc.edge.id;
                    const strokeColor = isHovered ? edgeHoverColor : `url(#${calc.gradientId})`;
                    const markerColor = isHovered ? edgeHoverColor : calc.targetColor;
                    const markerId = `arrowhead-${markerColor.replace('#', '')}`;

                    return (
                        <EdgeLine
                            key={calc.edge.id}
                            x1={calc.x1} y1={calc.y1}
                            x2={calc.x2} y2={calc.y2}
                            stroke={strokeColor}
                            strokeWidth={6}
                            opacity={isHovered ? 1 : 0.5}
                            markerId={markerId}
                            onMouseEnter={() => setHoveredEdgeId(calc.edge.id)}
                            onMouseLeave={() => setHoveredEdgeId(null)}
                            onClick={() => onEdgeClick && onEdgeClick(calc.edge)}
                        />
                    );
                })}
            </g>

            <g>
                {Array.from(nodeMap.values()).map(({ x, y, node }) => (
                    <g key={node.id} transform={`translate(${x}, ${y})`}>
                        <circle r={NODE_RADIUS} fill={node.fill || '#A9A9A9'} />
                        <text
                            y={NODE_RADIUS + 5}
                            textAnchor="middle" dominantBaseline="hanging"
                            fill="#333" fontSize="10px" fontWeight="500"
                            stroke="white" strokeWidth="0.4em" paintOrder="stroke"
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
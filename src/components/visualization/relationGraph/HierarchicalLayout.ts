// src/utils/HierarchicalLayout.ts

import { Node, Edge } from './GraphCanvas';

export interface LayoutNode {
    id: string;
    x: number;
    y: number;
    node: Node;
}

export interface HierarchicalLayoutConfig {
    width: number;
    height: number;
    nodeRadius: number;
    horizontalSpacing?: number;
    verticalSpacing?: number;
    leftPadding?: number;
    rightPadding?: number;
}

export class HierarchicalLayout {
    private config: Required<HierarchicalLayoutConfig>;

    constructor(config: HierarchicalLayoutConfig) {
        this.config = {
            horizontalSpacing: config.width * 0.3, // Default spacing between columns
            verticalSpacing: 60, // Default spacing between nodes in same column
            leftPadding: 80, // Default left padding
            rightPadding: 80, // Default right padding
            ...config,
        };
    }

    /**
     * Calculate hierarchical layout positions for nodes
     * @param nodes - Array of all nodes
     * @param edges - Array of all edges
     * @returns Map of node positions
     */
    calculateLayout(nodes: Node[], edges: Edge[]): Map<string, LayoutNode> {
        const positionMap = new Map<string, LayoutNode>();
        
        if (nodes.length === 0) return positionMap;

        // Step 1: Build adjacency list for outgoing edges
        const outgoingEdges = new Map<string, string[]>();
        const incomingEdges = new Map<string, string[]>();
        
        edges.forEach(edge => {
            // Track outgoing edges (what this node points to)
            if (!outgoingEdges.has(edge.source)) {
                outgoingEdges.set(edge.source, []);
            }
            outgoingEdges.get(edge.source)!.push(edge.target);
            
            // Track incoming edges (what points to this node)
            if (!incomingEdges.has(edge.target)) {
                incomingEdges.set(edge.target, []);
            }
            incomingEdges.get(edge.target)!.push(edge.source);
        });

        // Step 2: Identify source nodes (no incoming edges)
        const sourceNodeIds = new Set<string>();
        nodes.forEach(node => {
            if (!incomingEdges.has(node.id)) {
                sourceNodeIds.add(node.id);
            }
        });

        // Step 3: Identify first-order nodes (directly connected to source nodes)
        const firstOrderNodeIds = new Set<string>();
        sourceNodeIds.forEach(sourceId => {
            const targets = outgoingEdges.get(sourceId) || [];
            targets.forEach(targetId => {
                firstOrderNodeIds.add(targetId);
            });
        });

        // Step 4: Categorize nodes into hierarchy levels
        const sourceNodes: Node[] = [];
        const firstOrderNodes: Node[] = [];
        const secondOrderNodes: Node[] = [];

        nodes.forEach(node => {
            if (sourceNodeIds.has(node.id)) {
                sourceNodes.push(node);
            } else if (firstOrderNodeIds.has(node.id)) {
                firstOrderNodes.push(node);
            } else {
                // Everything else is second order
                secondOrderNodes.push(node);
            }
        });

        // Step 5: Calculate column positions
        const leftX = this.config.leftPadding + this.config.nodeRadius;
        const rightX = this.config.width - this.config.rightPadding - this.config.nodeRadius;
        const centerX = leftX + (rightX - leftX) / 2;

        // Step 6: Position nodes in each column
        this.positionNodesInColumn(sourceNodes, leftX, positionMap);
        this.positionNodesInColumn(firstOrderNodes, centerX, positionMap);
        this.positionNodesInColumn(secondOrderNodes, rightX, positionMap);

        return positionMap;
    }

    /**
     * Position nodes vertically within a column
     */
    private positionNodesInColumn(
        columnNodes: Node[], 
        x: number, 
        positionMap: Map<string, LayoutNode>
    ): void {
        if (columnNodes.length === 0) return;

        const availableHeight = this.config.height - (2 * this.config.nodeRadius) - 100; // Leave margins
        const startY = this.config.nodeRadius + 50;

        if (columnNodes.length === 1) {
            // Single node - center it vertically
            const y = this.config.height / 2;
            positionMap.set(columnNodes[0].id, {
                id: columnNodes[0].id,
                x,
                y,
                node: columnNodes[0]
            });
        } else {
            // Multiple nodes - distribute evenly
            const spacing = Math.min(
                this.config.verticalSpacing,
                availableHeight / (columnNodes.length - 1)
            );

            columnNodes.forEach((node, index) => {
                const y = startY + (index * spacing);
                positionMap.set(node.id, {
                    id: node.id,
                    x,
                    y,
                    node
                });
            });
        }
    }

    /**
     * Helper method to get layout statistics for debugging
     */
    getLayoutStats(nodes: Node[], edges: Edge[]): {
        sourceCount: number;
        firstOrderCount: number;
        secondOrderCount: number;
        totalEdges: number;
    } {
        const outgoingEdges = new Map<string, string[]>();
        const incomingEdges = new Map<string, string[]>();
        
        edges.forEach(edge => {
            if (!outgoingEdges.has(edge.source)) {
                outgoingEdges.set(edge.source, []);
            }
            outgoingEdges.get(edge.source)!.push(edge.target);
            
            if (!incomingEdges.has(edge.target)) {
                incomingEdges.set(edge.target, []);
            }
            incomingEdges.get(edge.target)!.push(edge.source);
        });

        // Identify source nodes (no incoming edges)
        const sourceNodeIds = new Set<string>();
        nodes.forEach(node => {
            if (!incomingEdges.has(node.id)) {
                sourceNodeIds.add(node.id);
            }
        });

        // Identify first-order nodes (directly connected to source nodes)
        const firstOrderNodeIds = new Set<string>();
        sourceNodeIds.forEach(sourceId => {
            const targets = outgoingEdges.get(sourceId) || [];
            targets.forEach(targetId => {
                firstOrderNodeIds.add(targetId);
            });
        });

        let sourceCount = 0;
        let firstOrderCount = 0;
        let secondOrderCount = 0;

        nodes.forEach(node => {
            if (sourceNodeIds.has(node.id)) {
                sourceCount++;
            } else if (firstOrderNodeIds.has(node.id)) {
                firstOrderCount++;
            } else {
                secondOrderCount++;
            }
        });

        return {
            sourceCount,
            firstOrderCount,
            secondOrderCount,
            totalEdges: edges.length
        };
    }
}
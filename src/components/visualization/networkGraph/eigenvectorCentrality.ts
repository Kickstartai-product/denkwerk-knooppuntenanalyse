/**
 * Implementation of weighted eigenvector centrality algorithms
 */
import { NetworkData, Node, Edge } from './types';

/**
 * Edge map structure for centrality calculations
 */
interface EdgeMapItem {
  neighborId: string;
  weight: number;
}

/**
 * Creates edge maps for centrality calculations
 */
const createEdgeMaps = (nodes: Node[], edges: Edge[]) => {
  // Create maps to store incoming and outgoing edges for each node with weights
  const incomingEdges = new Map<string, EdgeMapItem[]>();
  const outgoingEdges = new Map<string, EdgeMapItem[]>();
  const undirectedEdges = new Map<string, EdgeMapItem[]>();
  
  // Initialize empty arrays for all nodes
  nodes.forEach(node => {
    incomingEdges.set(node.id, []);
    outgoingEdges.set(node.id, []);
    undirectedEdges.set(node.id, []);
  });
  
  // Populate the directed edge maps using the edges
  edges.forEach(edge => {
    const sourceId = edge.source;
    const targetId = edge.target;
    const weight = edge.weight !== undefined ? edge.weight : 0; // Default to 1 if weight is not provided
    
    // Add targetId to the outgoing edges of sourceId with weight
    const outEdges = outgoingEdges.get(sourceId) || [];
    outEdges.push({ neighborId: targetId, weight });
    outgoingEdges.set(sourceId, outEdges);
    
    // Add sourceId to the incoming edges of targetId with weight
    const inEdges = incomingEdges.get(targetId) || [];
    inEdges.push({ neighborId: sourceId, weight });
    incomingEdges.set(targetId, inEdges);
    
    // For undirected graph, add both connections with weights
    const sourceUndirectedEdges = undirectedEdges.get(sourceId) || [];
    sourceUndirectedEdges.push({ neighborId: targetId, weight });
    undirectedEdges.set(sourceId, sourceUndirectedEdges);
    
    const targetUndirectedEdges = undirectedEdges.get(targetId) || [];
    targetUndirectedEdges.push({ neighborId: sourceId, weight });
    undirectedEdges.set(targetId, targetUndirectedEdges);
  });
  
  return { incomingEdges, outgoingEdges, undirectedEdges };
};

/**
 * Creates category-filtered edge maps for cross-category centrality calculations
 */
const createCrossCategoryEdgeMaps = (nodes: Node[], edges: Edge[]) => {
  // Create maps to store cross-category incoming and outgoing edges for each node with weights
  const incomingEdges = new Map<string, EdgeMapItem[]>();
  const outgoingEdges = new Map<string, EdgeMapItem[]>();
  const undirectedEdges = new Map<string, EdgeMapItem[]>();
  
  // Create a map of node id to category for quick lookups
  const nodeCategories = new Map<string, string>();
  nodes.forEach(node => {
    nodeCategories.set(node.id, node.category);
    
    // Initialize empty arrays for all nodes
    incomingEdges.set(node.id, []);
    outgoingEdges.set(node.id, []);
    undirectedEdges.set(node.id, []);
  });
  
  // Populate the directed edge maps using the edges, but only for cross-category edges
  edges.forEach(edge => {
    const sourceId = edge.source;
    const targetId = edge.target;
    const sourceCategory = nodeCategories.get(sourceId);
    const targetCategory = nodeCategories.get(targetId);
    
    // Skip if both nodes are in the same category
    if (sourceCategory === targetCategory) {
      return;
    }
    
    const weight = edge.weight !== undefined ? edge.weight : 0; // Default to 1 if weight is not provided
    
    // Add targetId to the outgoing edges of sourceId with weight
    const outEdges = outgoingEdges.get(sourceId) || [];
    outEdges.push({ neighborId: targetId, weight });
    outgoingEdges.set(sourceId, outEdges);
    
    // Add sourceId to the incoming edges of targetId with weight
    const inEdges = incomingEdges.get(targetId) || [];
    inEdges.push({ neighborId: sourceId, weight });
    incomingEdges.set(targetId, inEdges);
    
    // For undirected graph, add both connections with weights
    const sourceUndirectedEdges = undirectedEdges.get(sourceId) || [];
    sourceUndirectedEdges.push({ neighborId: targetId, weight });
    undirectedEdges.set(sourceId, sourceUndirectedEdges);
    
    const targetUndirectedEdges = undirectedEdges.get(targetId) || [];
    targetUndirectedEdges.push({ neighborId: sourceId, weight });
    undirectedEdges.set(targetId, targetUndirectedEdges);
  });
  
  return { incomingEdges, outgoingEdges, undirectedEdges };
};

/**
 * Calculate eigenvector centrality for a given set of nodes and edge maps
 */
const calculateEigenvector = (
  nodes: Node[], 
  nodeMap: Map<string, Node>,
  edgeMaps: {
    undirectedEdges: Map<string, EdgeMapItem[]>,
    incomingEdges: Map<string, EdgeMapItem[]>,
    outgoingEdges: Map<string, EdgeMapItem[]>
  },
  iterations: number,
  propertyPrefix: string = ''
): void => {
  const { undirectedEdges, incomingEdges, outgoingEdges } = edgeMaps;
  
  // 1. Undirected weighted eigenvector centrality
  for (let step = 0; step < iterations; step++) {
    // Create temporary scores for this iteration
    const tempScores = new Map<string, number>();
    let norm = 0;
    
    // Update each node's score based on its weighted neighbors
    nodes.forEach(node => {
      const neighbors = undirectedEdges.get(node.id) || [];
      let newScore = 0;
      
      // Sum the weighted scores of all neighbors
      neighbors.forEach(({neighborId, weight}) => {
        const neighbor = nodeMap.get(neighborId);
        if (neighbor && neighbor.data) {
          const centralityProp = `${propertyPrefix}eigen_centrality`;
          const centralityValue = neighbor.data[centralityProp];
          if (centralityValue !== undefined) {
            newScore += centralityValue * weight;
          }
        }
      });
      
      tempScores.set(node.id, newScore);
      norm += Math.pow(newScore, 2);
    });
    
    // Normalize scores
    norm = Math.sqrt(norm);
    if (norm > 0) {
      nodes.forEach(node => {
        if (node.data) {
          const centralityProp = `${propertyPrefix}eigen_centrality`;
          node.data[centralityProp] = (tempScores.get(node.id) || 0) / norm;
        }
      });
    }
  }
  
  // 2. In-degree weighted eigenvector centrality (prestige)
  for (let step = 0; step < iterations; step++) {
    // Create temporary scores for this iteration
    const tempScores = new Map<string, number>();
    let norm = 0;
    
    // Update each node's score based on its weighted incoming neighbors
    nodes.forEach(node => {
      const edges = incomingEdges.get(node.id) || [];
      let newScore = 0;
      
      // Sum the weighted scores of all incoming neighbors
      edges.forEach(({neighborId, weight}) => {
        const neighbor = nodeMap.get(neighborId);
        if (neighbor && neighbor.data) {
          const centralityProp = `${propertyPrefix}eigen_centrality_in`;
          const centralityValue = neighbor.data[centralityProp];
          if (centralityValue !== undefined) {
            newScore += centralityValue * weight;
          }
        }
      });
      
      tempScores.set(node.id, newScore);
      norm += Math.pow(newScore, 2);
    });
    
    // Normalize scores
    norm = Math.sqrt(norm);
    if (norm > 0) {
      nodes.forEach(node => {
        if (node.data) {
          const centralityProp = `${propertyPrefix}eigen_centrality_in`;
          node.data[centralityProp] = (tempScores.get(node.id) || 0) / norm;
        }
      });
    }
  }
  
  // 3. Out-degree weighted eigenvector centrality (importance)
  for (let step = 0; step < iterations; step++) {
    // Create temporary scores for this iteration
    const tempScores = new Map<string, number>();
    let norm = 0;
    
    // Update each node's score based on its weighted outgoing neighbors
    nodes.forEach(node => {
      const edges = outgoingEdges.get(node.id) || [];
      let newScore = 0;
      
      // Sum the weighted scores of all outgoing neighbors
      edges.forEach(({neighborId, weight}) => {
        const neighbor = nodeMap.get(neighborId);
        if (neighbor && neighbor.data) {
          const centralityProp = `${propertyPrefix}eigen_centrality_out`;
          const centralityValue = neighbor.data[centralityProp];
          if (centralityValue !== undefined) {
            newScore += centralityValue * weight;
          }
        }
      });
      
      tempScores.set(node.id, newScore);
      norm += Math.pow(newScore, 2);
    });
    
    // Normalize scores
    norm = Math.sqrt(norm);
    if (norm > 0) {
      nodes.forEach(node => {
        if (node.data) {
          const centralityProp = `${propertyPrefix}eigen_centrality_out`;
          node.data[centralityProp] = (tempScores.get(node.id) || 0) / norm;
        }
      });
    }
  }
};

/**
 * Modified centrality calculations
 * - eigen_centrality: treats the graph as undirected
 * - eigen_centrality_in: based on incoming edges (prestige)
 * - eigen_centrality_out: based on outgoing edges (importance)
 * 
 * @param networkData The network data containing nodes and edges
 * @param iterations The number of iterations to run the algorithm
 * @returns The network data with updated eigenvector centrality scores
 */
export const calculateWeightedEigenvectorCentrality = (
  networkData: NetworkData, 
  iterations: number = 10
): NetworkData => {
  const { nodes, edges } = networkData;
  
  // Create a map for quick access to nodes by id
  const nodeMap = new Map<string, Node>();
  
  // Step 1: Initialize all eigenvector centrality scores to 1
  nodes.forEach(node => {
    // Ensure data object exists
    if (!node.data) {
      node.data = {};
    }
    
    // Initialize regular eigenvector centrality scores
    node.data.eigen_centrality = 1;
    node.data.eigen_centrality_in = 1;
    node.data.eigen_centrality_out = 1;
    
    // Initialize cross-category eigenvector centrality scores
    node.data.cross_category_eigen_centrality = 1;
    node.data.cross_category_eigen_centrality_in = 1;
    node.data.cross_category_eigen_centrality_out = 1;
    
    nodeMap.set(node.id, node);
  });
  
  // Create edge maps for regular centrality calculations
  const regularEdgeMaps = createEdgeMaps(nodes, edges);
  
  // Create edge maps for cross-category centrality calculations
  const crossCategoryEdgeMaps = createCrossCategoryEdgeMaps(nodes, edges);
  
  // Calculate regular eigenvector centrality
  calculateEigenvector(nodes, nodeMap, regularEdgeMaps, iterations);
  
  // Calculate cross-category eigenvector centrality
  calculateEigenvector(nodes, nodeMap, crossCategoryEdgeMaps, iterations, 'cross_category_');
  
  return { nodes, edges };
};
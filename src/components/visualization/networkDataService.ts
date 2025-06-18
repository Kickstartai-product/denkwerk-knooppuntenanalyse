/**
 * Service to fetch and manage network graph data
 */

// Define type for citation objects
export interface Citation {
  title: string;
  document_type: string;
  source: string;
  publication_date: string;
  document_link: string;
  citaat: string;
}

  // Define type for relation citation objects
  export interface RelationCitation {
    filename: string;
    citaat: string;
    oorzaak: string;
    gevolg: string;
    publication_date: string;
    source: string;
    title: string;
    document_link: string;
  }
  
// Define types for our enhanced network data
export interface Node {
  id: string;
  label: string;
  summary: string; // Added summary field
  citaten: Citation[];
  nr_docs: number;
  nr_citations: number;
  data?: {
    hub?: number;    // Added for HITS algorithm
    auth?: number;   // Added for HITS algorithm
    [key: string]: any;
  };
  category: string; // Added category field
  [key: string]: any; // For any additional properties
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
  raw_count: number;
  citaat_relaties: RelationCitation[];
  [key: string]: any; // For any additional properties
}

export interface NetworkData {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Fetches network data from JSON files
 */
export const fetchNetworkData = async (): Promise<NetworkData> => {
  try {
    // Get the base URL for GitHub Pages in Vite
    const basePath = import.meta.env.BASE_URL;
    
    // Fetch nodes and edges data from JSON files with the correct base path
    const [nodesResponse, edgesResponse] = await Promise.all([
      fetch(`${basePath}nodes.json`),
      fetch(`${basePath}edges.json`)
    ]);
    
    // Check if responses are successful
    if (!nodesResponse.ok || !edgesResponse.ok) {
      throw new Error('Failed to fetch graph data');
    }
    
    // Parse JSON responses
    const nodes = await nodesResponse.json();
    const edges = await edgesResponse.json();
    
    return { nodes, edges };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error loading graph data:', errorMessage);
    throw error;
  }
};

/**
 * Implements the HITS algorithm to calculate hub and authority scores for nodes
 * @param networkData The network data containing nodes and edges
 * @param k The number of iterations to run the algorithm
 * @returns The network data with updated hub and authority scores
 */
export const calculateHITS = (networkData: NetworkData, k: number = 10): NetworkData => {
  const { nodes, edges } = networkData;
  
  // Create a map for quick access to nodes by id
  const nodeMap = new Map<string, Node>();
  
  // Step 1: Initialize all hub and authority scores to 1
  nodes.forEach(node => {
    // Ensure data object exists
    if (!node.data) {
      node.data = {};
    }
    node.data.auth = 1;
    node.data.hub = 1;
    nodeMap.set(node.id, node);
  });
  
  // Create maps to store incoming and outgoing neighbors for each node
  const incomingNeighbors = new Map<string, string[]>();
  const outgoingNeighbors = new Map<string, string[]>();
  
  // Initialize empty arrays for all nodes
  nodes.forEach(node => {
    incomingNeighbors.set(node.id, []);
    outgoingNeighbors.set(node.id, []);
  });
  
  // Populate the neighbors maps using the edges
  edges.forEach(edge => {
    const sourceId = edge.source;
    const targetId = edge.target;
    
    // Add targetId to the outgoing neighbors of sourceId
    const outNeighbors = outgoingNeighbors.get(sourceId) || [];
    outNeighbors.push(targetId);
    outgoingNeighbors.set(sourceId, outNeighbors);
    
    // Add sourceId to the incoming neighbors of targetId
    const inNeighbors = incomingNeighbors.get(targetId) || [];
    inNeighbors.push(sourceId);
    incomingNeighbors.set(targetId, inNeighbors);
  });
  
  // Run the HITS algorithm for k iterations
  for (let step = 0; step < k; step++) {
    // Update authority scores
    let norm = 0;
    
    // First update all authority values
    nodes.forEach(node => {
      if (!node.data) node.data = {};
      node.data.auth = 0;
      const inNeighbors = incomingNeighbors.get(node.id) || [];
      
      // Sum the hub scores of all incoming neighbors
      inNeighbors.forEach(neighborId => {
        const neighbor = nodeMap.get(neighborId);
        if (node.data && neighbor && neighbor.data && neighbor.data.hub !== undefined) {
          node.data.auth! += neighbor.data.hub;
        }
      });
      
      // Calculate the sum of the squared auth values for normalization
      norm += Math.pow(node.data.auth || 0, 2);
    });
    
    // Normalize authority scores
    norm = Math.sqrt(norm);
    if (norm > 0) {
      nodes.forEach(node => {
        if (node.data && node.data.auth !== undefined) {
          node.data.auth = node.data.auth / norm;
        }
      });
    }
    
    // Then update all hub values
    norm = 0;
    nodes.forEach(node => {
      if (!node.data) node.data = {};
      node.data.hub = 0;
      const outNeighbors = outgoingNeighbors.get(node.id) || [];
      
      // Sum the authority scores of all outgoing neighbors
      outNeighbors.forEach(neighborId => {
        const neighbor = nodeMap.get(neighborId);
        if (node.data && neighbor && neighbor.data && neighbor.data.auth !== undefined) {
          node.data.hub! += neighbor.data.auth;
        }
      });
      
      // Calculate the sum of the squared hub values for normalization
      norm += Math.pow(node.data.hub || 0, 2);
    });
    
    // Normalize hub scores
    norm = Math.sqrt(norm);
    if (norm > 0) {
      nodes.forEach(node => {
        if (node.data && node.data.hub !== undefined) {
          node.data.hub = node.data.hub / norm;
        }
      });
    }
  }
  
  return { nodes, edges };
};

/**
 * Modified HITS algorithm that takes edge weights into account
 * @param networkData The network data containing nodes and edges
 * @param k The number of iterations to run the algorithm
 * @returns The network data with updated hub and authority scores
 */
export const calculateWeightedHITS = (networkData: NetworkData, k: number = 10): NetworkData => {
  const { nodes, edges } = networkData;
  
  // Create a map for quick access to nodes by id
  const nodeMap = new Map<string, Node>();
  
  // Step 1: Initialize all hub and authority scores to 1
  nodes.forEach(node => {
    // Ensure data object exists
    if (!node.data) {
      node.data = {};
    }
    node.data.auth = 1;
    node.data.hub = 1;
    nodeMap.set(node.id, node);
  });
  
  // Create maps to store incoming and outgoing edges for each node with their weights
  const incomingEdges = new Map<string, {sourceId: string, weight: number}[]>();
  const outgoingEdges = new Map<string, {targetId: string, weight: number}[]>();
  
  // Initialize empty arrays for all nodes
  nodes.forEach(node => {
    incomingEdges.set(node.id, []);
    outgoingEdges.set(node.id, []);
  });
  
  // Populate the edge maps using the edges and their weights
  edges.forEach(edge => {
    const sourceId = edge.source;
    const targetId = edge.target;
    const weight = edge.weight !== undefined ? edge.weight : 1; // Default to 1 if weight is not provided
    
    // Add targetId to the outgoing edges of sourceId with weight
    const outEdges = outgoingEdges.get(sourceId) || [];
    outEdges.push({ targetId, weight });
    outgoingEdges.set(sourceId, outEdges);
    
    // Add sourceId to the incoming edges of targetId with weight
    const inEdges = incomingEdges.get(targetId) || [];
    inEdges.push({ sourceId, weight });
    incomingEdges.set(targetId, inEdges);
  });
  
  // Run the weighted HITS algorithm for k iterations
  for (let step = 0; step < k; step++) {
    // Update authority scores
    let norm = 0;
    
    // First update all authority values
    nodes.forEach(node => {
      if (!node.data) node.data = {};
      node.data.auth = 0;
      const inEdges = incomingEdges.get(node.id) || [];
      
      // Sum the weighted hub scores of all incoming neighbors
      inEdges.forEach(({sourceId, weight}) => {
        const neighbor = nodeMap.get(sourceId);
        if (node.data && neighbor && neighbor.data && neighbor.data.hub !== undefined) {
          // Multiply by edge weight
          node.data.auth! += neighbor.data.hub * weight;
        }
      });
      
      // Calculate the sum of the squared auth values for normalization
      norm += Math.pow(node.data.auth || 0, 2);
    });
    
    // Normalize authority scores
    norm = Math.sqrt(norm);
    if (norm > 0) {
      nodes.forEach(node => {
        if (node.data && node.data.auth !== undefined) {
          node.data.auth = node.data.auth / norm;
        }
      });
    }
    
    // Then update all hub values
    norm = 0;
    nodes.forEach(node => {
      if (!node.data) node.data = {};
      node.data.hub = 0;
      const outEdges = outgoingEdges.get(node.id) || [];
      
      // Sum the weighted authority scores of all outgoing neighbors
      outEdges.forEach(({targetId, weight}) => {
        const neighbor = nodeMap.get(targetId);
        if (node.data && neighbor && neighbor.data && neighbor.data.auth !== undefined) {
          // Multiply by edge weight
          node.data.hub! += neighbor.data.auth * weight;
        }
      });
      
      // Calculate the sum of the squared hub values for normalization
      norm += Math.pow(node.data.hub || 0, 2);
    });
    
    // Normalize hub scores
    norm = Math.sqrt(norm);
    if (norm > 0) {
      nodes.forEach(node => {
        if (node.data && node.data.hub !== undefined) {
          node.data.hub = node.data.hub / norm;
        }
      });
    }
  }
  
  return { nodes, edges };
};

/**
 * Example usage of the HITS algorithm
 */
export const getNetworkWithHITS = async (iterations: number = 10): Promise<NetworkData> => {
  const networkData = await fetchNetworkData();
  return calculateWeightedHITS(networkData, iterations);
};

/**
 * Calculates eigenvector centrality scores for nodes in the network
 * - eigen_centrality: treats the graph as undirected
 * - eigen_centrality_in: based on incoming edges (prestige)
 * - eigen_centrality_out: based on outgoing edges (importance)
 * 
 * @param networkData The network data containing nodes and edges
 * @param k The number of iterations to run the algorithm
 * @returns The network data with updated eigenvector centrality scores
 */
export const calculateEigenvectorCentrality = (networkData: NetworkData, k: number = 10): NetworkData => {
  const { nodes, edges } = networkData;
  
  // Create a map for quick access to nodes by id
  const nodeMap = new Map<string, Node>();
  
  // Step 1: Initialize all eigenvector centrality scores to 1
  nodes.forEach(node => {
    // Ensure data object exists
    if (!node.data) {
      node.data = {};
    }
    node.data.eigen_centrality = 1;
    node.data.eigen_centrality_in = 1;
    node.data.eigen_centrality_out = 1;
    nodeMap.set(node.id, node);
  });
  
  // Create maps to store incoming and outgoing neighbors for each node
  const incomingNeighbors = new Map<string, string[]>();
  const outgoingNeighbors = new Map<string, string[]>();
  
  // Initialize empty arrays for all nodes
  nodes.forEach(node => {
    incomingNeighbors.set(node.id, []);
    outgoingNeighbors.set(node.id, []);
  });
  
  // Populate the directed neighbors maps using the edges
  edges.forEach(edge => {
    const sourceId = edge.source;
    const targetId = edge.target;
    
    // Add targetId to the outgoing neighbors of sourceId
    const outNeighbors = outgoingNeighbors.get(sourceId) || [];
    outNeighbors.push(targetId);
    outgoingNeighbors.set(sourceId, outNeighbors);
    
    // Add sourceId to the incoming neighbors of targetId
    const inNeighbors = incomingNeighbors.get(targetId) || [];
    inNeighbors.push(sourceId);
    incomingNeighbors.set(targetId, inNeighbors);
  });
  
  // Create undirected neighbors map by combining incoming and outgoing
  const undirectedNeighbors = new Map<string, string[]>();
  
  nodes.forEach(node => {
    const nodeId = node.id;
    const inNeighbors = incomingNeighbors.get(nodeId) || [];
    const outNeighbors = outgoingNeighbors.get(nodeId) || [];
    
    // Use a Set to avoid duplicates when combining in and out neighbors
    const allNeighborsSet = new Set([...inNeighbors, ...outNeighbors]);
    undirectedNeighbors.set(nodeId, Array.from(allNeighborsSet));
  });
  
  // 1. Undirected eigenvector centrality
  for (let step = 0; step < k; step++) {
    // Create temporary scores for this iteration
    const tempScores = new Map<string, number>();
    let norm = 0;
    
    // Update each node's score based on its neighbors
    nodes.forEach(node => {
      const neighbors = undirectedNeighbors.get(node.id) || [];
      let newScore = 0;
      
      // Sum the scores of all neighbors
      neighbors.forEach(neighborId => {
        const neighbor = nodeMap.get(neighborId);
        if (neighbor && neighbor.data && neighbor.data.eigen_centrality !== undefined) {
          newScore += neighbor.data.eigen_centrality;
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
          node.data.eigen_centrality = (tempScores.get(node.id) || 0) / norm;
        }
      });
    }
  }
  
  // 2. In-degree eigenvector centrality (prestige)
  for (let step = 0; step < k; step++) {
    // Create temporary scores for this iteration
    const tempScores = new Map<string, number>();
    let norm = 0;
    
    // Update each node's score based on its incoming neighbors
    nodes.forEach(node => {
      const neighbors = incomingNeighbors.get(node.id) || [];
      let newScore = 0;
      
      // Sum the scores of all incoming neighbors
      neighbors.forEach(neighborId => {
        const neighbor = nodeMap.get(neighborId);
        if (neighbor && neighbor.data && neighbor.data.eigen_centrality_in !== undefined) {
          newScore += neighbor.data.eigen_centrality_in;
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
          node.data.eigen_centrality_in = (tempScores.get(node.id) || 0) / norm;
        }
      });
    }
  }
  
  // 3. Out-degree eigenvector centrality (importance)
  for (let step = 0; step < k; step++) {
    // Create temporary scores for this iteration
    const tempScores = new Map<string, number>();
    let norm = 0;
    
    // Update each node's score based on its outgoing neighbors
    nodes.forEach(node => {
      const neighbors = outgoingNeighbors.get(node.id) || [];
      let newScore = 0;
      
      // Sum the scores of all outgoing neighbors
      neighbors.forEach(neighborId => {
        const neighbor = nodeMap.get(neighborId);
        if (neighbor && neighbor.data && neighbor.data.eigen_centrality_out !== undefined) {
          newScore += neighbor.data.eigen_centrality_out;
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
          node.data.eigen_centrality_out = (tempScores.get(node.id) || 0) / norm;
        }
      });
    }
  }
  
  return { nodes, edges };
};

/**
 * Modified eigenvector centrality that takes edge weights into account
 * @param networkData The network data containing nodes and edges
 * @param k The number of iterations to run the algorithm
 * @returns The network data with updated eigenvector centrality scores
 */
export const calculateWeightedEigenvectorCentrality = (networkData: NetworkData, k: number = 10): NetworkData => {
  const { nodes, edges } = networkData;
  
  // Create a map for quick access to nodes by id
  const nodeMap = new Map<string, Node>();
  
  // Step 1: Initialize all eigenvector centrality scores to 1
  nodes.forEach(node => {
    // Ensure data object exists
    if (!node.data) {
      node.data = {};
    }
    node.data.eigen_centrality = 1;
    node.data.eigen_centrality_in = 1;
    node.data.eigen_centrality_out = 1;
    nodeMap.set(node.id, node);
  });
  
  // Create maps to store incoming and outgoing edges for each node with weights
  const incomingEdges = new Map<string, {sourceId: string, weight: number}[]>();
  const outgoingEdges = new Map<string, {targetId: string, weight: number}[]>();
  
  // Initialize empty arrays for all nodes
  nodes.forEach(node => {
    incomingEdges.set(node.id, []);
    outgoingEdges.set(node.id, []);
  });
  
  // Create map for undirected edges
  const undirectedEdges = new Map<string, {neighborId: string, weight: number}[]>();
  nodes.forEach(node => {
    undirectedEdges.set(node.id, []);
  });
  
  // Populate the directed edge maps using the edges
  edges.forEach(edge => {
    const sourceId = edge.source;
    const targetId = edge.target;
    const weight = edge.weight !== undefined ? edge.weight : 1; // Default to 1 if weight is not provided
    
    // Add targetId to the outgoing edges of sourceId with weight
    const outEdges = outgoingEdges.get(sourceId) || [];
    outEdges.push({ targetId, weight });
    outgoingEdges.set(sourceId, outEdges);
    
    // Add sourceId to the incoming edges of targetId with weight
    const inEdges = incomingEdges.get(targetId) || [];
    inEdges.push({ sourceId, weight });
    incomingEdges.set(targetId, inEdges);
    
    // For undirected graph, add both connections with weights
    const sourceUndirectedEdges = undirectedEdges.get(sourceId) || [];
    sourceUndirectedEdges.push({ neighborId: targetId, weight });
    undirectedEdges.set(sourceId, sourceUndirectedEdges);
    
    const targetUndirectedEdges = undirectedEdges.get(targetId) || [];
    targetUndirectedEdges.push({ neighborId: sourceId, weight });
    undirectedEdges.set(targetId, targetUndirectedEdges);
  });
  
  // 1. Undirected weighted eigenvector centrality
  for (let step = 0; step < k; step++) {
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
        if (neighbor && neighbor.data && neighbor.data.eigen_centrality !== undefined) {
          newScore += neighbor.data.eigen_centrality * weight;
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
          node.data.eigen_centrality = (tempScores.get(node.id) || 0) / norm;
        }
      });
    }
  }
  
  // 2. In-degree weighted eigenvector centrality (prestige)
  for (let step = 0; step < k; step++) {
    // Create temporary scores for this iteration
    const tempScores = new Map<string, number>();
    let norm = 0;
    
    // Update each node's score based on its weighted incoming neighbors
    nodes.forEach(node => {
      const edges = incomingEdges.get(node.id) || [];
      let newScore = 0;
      
      // Sum the weighted scores of all incoming neighbors
      edges.forEach(({sourceId, weight}) => {
        const neighbor = nodeMap.get(sourceId);
        if (neighbor && neighbor.data && neighbor.data.eigen_centrality_in !== undefined) {
          newScore += neighbor.data.eigen_centrality_in * weight;
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
          node.data.eigen_centrality_in = (tempScores.get(node.id) || 0) / norm;
        }
      });
    }
  }
  
  // 3. Out-degree weighted eigenvector centrality (importance)
  for (let step = 0; step < k; step++) {
    // Create temporary scores for this iteration
    const tempScores = new Map<string, number>();
    let norm = 0;
    
    // Update each node's score based on its weighted outgoing neighbors
    nodes.forEach(node => {
      const edges = outgoingEdges.get(node.id) || [];
      let newScore = 0;
      
      // Sum the weighted scores of all outgoing neighbors
      edges.forEach(({targetId, weight}) => {
        const neighbor = nodeMap.get(targetId);
        if (neighbor && neighbor.data && neighbor.data.eigen_centrality_out !== undefined) {
          newScore += neighbor.data.eigen_centrality_out * weight;
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
          node.data.eigen_centrality_out = (tempScores.get(node.id) || 0) / norm;
        }
      });
    }
  }
  
  return { nodes, edges };
};


/**
 * Get network data with both HITS and eigenvector centrality calculations
 */
export const getNetworkWithAllCentralityMetrics = async (iterations: number = 10): Promise<NetworkData> => {
  const networkData = await fetchNetworkData();
  const networkWithHITS = calculateWeightedHITS(networkData, iterations);
  return calculateWeightedEigenvectorCentrality(networkWithHITS, iterations);
};
/**
 * Service to fetch network graph data
 */
import { NetworkData } from './types';

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
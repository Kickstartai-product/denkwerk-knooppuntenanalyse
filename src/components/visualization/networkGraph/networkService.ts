/**
 * Main network service module that ties together all components
 */
import { NetworkData, Edge } from './types';
import { fetchNetworkData } from './networkFetcher';
import { calculateWeightedEigenvectorCentrality } from './eigenvectorCentrality';
import { 
  applyThreatImpactWeights, 
  DEFAULT_THREAT_IMPACT_WEIGHTS,
  type ThreatImpactWeights
} from './threatImpactService';

/**
 * Get network data with eigenvector centrality calculations
 * Performs both regular and cross-category centrality metrics
 * 
 * @param iterations The number of iterations to run the algorithms (default: 10)
 * @param rawCountThreshold Threshold for edge visibility based on raw_count (default: 1)
 * @param threatImpactWeights Custom weights for each threat impact level (optional)
 * @returns The network data with updated eigenvector centrality scores
 */
export const getNetworkWithCentralityMetrics = async (
  iterations: number = 10,
  rawCountThreshold: number = 1,
  threatImpactWeights: ThreatImpactWeights = DEFAULT_THREAT_IMPACT_WEIGHTS
): Promise<NetworkData> => {
  // Fetch the raw network data
  const networkData = await fetchNetworkData();
  
  // Apply raw_count threshold to edge weights
  const thresholdedData = applyRawCountThreshold(networkData, rawCountThreshold);
  
  // Apply threat impact weights to the thresholded data
  const threatWeightedData = await applyThreatImpactWeights(thresholdedData, threatImpactWeights);
  
  // Calculate all eigenvector centrality metrics (both regular and cross-category)
  return calculateWeightedEigenvectorCentrality(threatWeightedData, iterations);
};

/**
 * Applies a threshold to edge weights based on raw_count
 * If raw_count >= threshold, weight = 1, otherwise weight = 0
 * 
 * @param networkData The original network data
 * @param threshold The minimum raw_count value for an edge to be visible
 * @returns The network data with thresholded weights
 */
export const applyRawCountThreshold = (
  networkData: NetworkData,
  threshold: number
): NetworkData => {
  if (!networkData || !networkData.edges) {
    return networkData;
  }

  const thresholdedEdges: Edge[] = networkData.edges.map(edge => ({
    ...edge,
    weight: edge.raw_count >= threshold ? 1 : 0
  }));

  return {
    ...networkData,
    edges: thresholdedEdges
  };
};

/**
 * Exports the main API functions and types for external use
 */
export * from './types';
export { fetchNetworkData } from './networkFetcher';
export { calculateWeightedEigenvectorCentrality } from './eigenvectorCentrality';
export * from './threatImpactService';
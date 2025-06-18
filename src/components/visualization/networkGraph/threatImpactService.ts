/**
 * Service to modify edge weights based on threat impact values
 */
import { NetworkData, Edge } from './types';

// Define threat impact levels and their corresponding weights
export type ThreatImpactLevel = 'Beperkt' | 'Aanzienlijk' | 'Ernstig' | 'Zeer ernstig' | 'Catastrofaal';
export type ThreatImpactWeights = Record<ThreatImpactLevel, number>;

/**
 * Default threat impact weights
 */
export const DEFAULT_THREAT_IMPACT_WEIGHTS: ThreatImpactWeights = {
  'Beperkt': 1,
  'Aanzienlijk': 3,
  'Ernstig': 9,
  'Zeer ernstig': 27,
  'Catastrofaal': 81
};

/**
 * Interface for threat impact data
 */
export interface ThreatImpactData {
  [threatName: string]: ThreatImpactLevel;
}

/**
 * Fetches threat impact data from JSON file
 */
export const fetchThreatImpactData = async (): Promise<ThreatImpactData> => {
  try {
    const basePath = import.meta.env.BASE_URL;
    const response = await fetch(`${basePath}threat_impact.json`);

    if (!response.ok) {
      throw new Error('Failed to fetch threat impact data');
    }

    return await response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error loading threat impact data:', errorMessage);
    throw error;
  }
};

/**
 * Applies threat impact weights to edge weights after thresholding
 * Only modifies weights if they are non-zero after thresholding
 * 
 * @param networkData The network data with thresholded weights
 * @param threatImpactWeights Custom weights for each threat impact level (optional)
 * @returns The network data with weights modified by threat impact
 */
export const applyThreatImpactWeights = async (
  networkData: NetworkData,
  threatImpactWeights: ThreatImpactWeights = DEFAULT_THREAT_IMPACT_WEIGHTS
): Promise<NetworkData> => {
  if (!networkData || !networkData.edges) {
    return networkData;
  }

  // Fetch threat impact data
  const threatImpactData = await fetchThreatImpactData();

  // Apply threat impact weights to edges
  const weightedEdges: Edge[] = networkData.edges.map(edge => {
    // Skip modifying edges that have been thresholded to 0
    if (edge.weight === 0) {
      return edge;
    }

    // Get the target node's threat impact level
    const targetThreat = edge.target;
    const impactLevel = threatImpactData[targetThreat] as ThreatImpactLevel;

    // If target threat exists in the threat impact data, apply the weight
    if (impactLevel && threatImpactWeights[impactLevel]) {
      return {
        ...edge,
        weight: edge.weight * threatImpactWeights[impactLevel],
        // Store the original weight and impact level for reference
        original_weight: edge.weight,
        threat_impact_level: impactLevel,
        threat_impact_weight: threatImpactWeights[impactLevel]
      };
    }
    else {
      console.warn(`No threat impact data found for target: ${targetThreat}`);
    }

    // If target not found in threat impact data, keep original weight
    return edge;
  });

  return {
    ...networkData,
    edges: weightedEdges
  };
};
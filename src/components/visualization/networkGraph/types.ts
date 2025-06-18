/**
 * Type definitions for network graph components
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
    summary: string;
    citaten: Citation[];
    nr_docs: number;
    nr_citations: number;
    data?: {
      eigen_centrality?: number;
      eigen_centrality_in?: number;
      eigen_centrality_out?: number;
      eigen_centrality_cross_category?: number;
      eigen_centrality_in_cross_category?: number;
      eigen_centrality_out_cross_category?: number;
      [key: string]: any;
    };
    category: string;
    [key: string]: any;
  }
  
  export interface Edge {
    id: string;
    source: string;
    target: string;
    label: string;
    weight: number;
    citaat_relaties: RelationCitation[];
    raw_count: number;
    [key: string]: any;
  }
  
  export interface NetworkData {
    nodes: Node[];
    edges: Edge[];
  }
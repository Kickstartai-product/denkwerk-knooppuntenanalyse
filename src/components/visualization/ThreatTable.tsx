// src/components/ThreatTable.tsx
import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from 'lucide-react';
import type { Node } from './networkGraph/networkService'; // Updated import path
import type { CentralityMetric } from './MainContent'; // Import the type from MainContent
import { longNodeDescriptions } from './shortNodeDescriptions';


// Define the columns we want to display and sort by
type SortableColumn = CentralityMetric | 'label' | 'nr_docs';

interface ThreatTableProps {
  nodes: Node[];
}

// Helper to get centrality value safely
const getCentralityValue = (node: Node, metric: CentralityMetric): number | null => {
  return node.data?.[metric] ?? null;
};

// Helper to format numbers or show 'N/A'
const formatScore = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return 'N/A';
  return score.toFixed(4);
};

// Mapping for user-friendly column names
const columnNames: Record<SortableColumn, string> = {
  label: 'Dreiging',
  nr_docs: 'Aantal citatiten',
  eigen_centrality: 'Ongerichte centraliteit',
  eigen_centrality_in: 'Inkomende centraliteit',
  eigen_centrality_out: 'Uitgaande centraliteit',
  cross_category_eigen_centrality: 'Categorie-overschrijdend ongericht',
  cross_category_eigen_centrality_in: 'Categorie-overschrijdend inkomend',
  cross_category_eigen_centrality_out: 'Categorie-overschrijdend uitgaand',
};

export const ThreatTable = ({ nodes }: ThreatTableProps) => {
  const [sortColumn, setSortColumn] = useState<SortableColumn>('cross_category_eigen_centrality_out'); // Default sort
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => {
      let valA: string | number | null = null;
      let valB: string | number | null = null;

      switch (sortColumn) {
        case 'label':
          valA = a.label.toLowerCase();
          valB = b.label.toLowerCase();
          break;
        case 'nr_docs':
          valA = a.nr_docs ?? 0;
          valB = b.nr_docs ?? 0;
          break;
        default: // Centrality metrics
          valA = getCentralityValue(a, sortColumn);
          valB = getCentralityValue(b, sortColumn);
          // Handle nulls: treat them as lowest value
          valA = valA === null ? -Infinity : valA;
          valB = valB === null ? -Infinity : valB;
          break;
      }

      if (valA < valB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [nodes, sortColumn, sortDirection]);

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      // Default to descending for centrality/counts, ascending for label
      setSortDirection(['label'].includes(column) ? 'asc' : 'desc');
    }
  };

  const renderSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />;
    }
    return sortDirection === 'desc'
      ? <ArrowUpDown className="ml-2 h-3 w-3" /> // Or specific down arrow
      : <ArrowUpDown className="ml-2 h-3 w-3 transform rotate-180" />; // Or specific up arrow
  };

  // Define the columns to display in the table
  const displayColumns: SortableColumn[] = [
    'label',
    'nr_docs',
    'eigen_centrality',
    'eigen_centrality_in',
    'eigen_centrality_out',
    'cross_category_eigen_centrality',
    'cross_category_eigen_centrality_in',
    'cross_category_eigen_centrality_out',
  ];

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4">
        <h4 className="text-lg font-semibold mb-2">Tabel centraliteitswaarden</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          Deze tabel toont verschillende centraliteitsmetrieken voor elke dreiging. In onze analyse gebruiken we de <strong>categorie-overschrijdende uitgaande centraliteit</strong>, 
          berekend over 2 iteraties. Deze metriek identificeert dreigingen die veel invloed uitoefenen op dreigingen in andere categorieën.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          <strong>Let op:</strong> Deze waarden zijn bedoeld voor ordinale vergelijking (rangorde), niet voor absolute interpretatie. 
        </p>
      </div>
      <div className="flex-grow overflow-auto border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {displayColumns.map(colKey => (
                <TableHead key={colKey} className={colKey === 'label' ? "" : "text-right"}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort(colKey)}
                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                  >
                    <span>{columnNames[colKey]}</span>
                    {renderSortIcon(colKey)}
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedNodes.length > 0 ? (
              sortedNodes.map((node) => (
                <TableRow key={node.id}>
                  <TableCell className="font-medium">{longNodeDescriptions[node.id]}</TableCell>
                  <TableCell className="text-right">{node.nr_docs ?? 'N/A'}</TableCell>
                  <TableCell className="text-right font-mono">{formatScore(getCentralityValue(node, 'eigen_centrality'))}</TableCell>
                  <TableCell className="text-right font-mono">{formatScore(getCentralityValue(node, 'eigen_centrality_in'))}</TableCell>
                  <TableCell className="text-right font-mono">{formatScore(getCentralityValue(node, 'eigen_centrality_out'))}</TableCell>
                  <TableCell className="text-right font-mono">{formatScore(getCentralityValue(node, 'cross_category_eigen_centrality'))}</TableCell>
                  <TableCell className="text-right font-mono">{formatScore(getCentralityValue(node, 'cross_category_eigen_centrality_in'))}</TableCell>
                  <TableCell className="text-right font-mono">{formatScore(getCentralityValue(node, 'cross_category_eigen_centrality_out'))}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={displayColumns.length} className="h-24 text-center">
                  No data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ThreatTable;
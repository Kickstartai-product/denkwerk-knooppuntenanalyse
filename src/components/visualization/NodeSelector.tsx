import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Node } from './networkDataService';
import { shortNodeDescriptions } from './shortNodeDescriptions';

interface NodeSelectorProps {
  nodes: Node[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  placeholder?: string;
}

const NodeSelector = ({
  nodes = [],
  selectedNodeId,
  onSelectNode,
  placeholder = "Select a node..."
}: NodeSelectorProps) => {
  const safeNodes = Array.isArray(nodes) ? nodes : [];

  /**
   * The description for the currently selected node, fetched from the map.
   * This is displayed in the trigger.
   */
  const selectedNodeDisplay = React.useMemo(() => {
    if (!selectedNodeId) {
      return null;
    }
    // Use the short description; fallback to the original label if not found.
    const selectedNode = safeNodes.find(node => node.id === selectedNodeId);
    return shortNodeDescriptions[selectedNodeId] || selectedNode?.label || null;
  }, [safeNodes, selectedNodeId]);

  const handleValueChange = (value: string) => {
    onSelectNode(value);
  };

  return (
    <Select
      value={selectedNodeId || ""}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {/* Display the short description for the selected node */}
          {selectedNodeDisplay}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {safeNodes.length > 0 ? (
          safeNodes.map((node) => (
            <SelectItem key={node.id} value={node.id}>
              {/* Display the short description for each item in the list */}
              {shortNodeDescriptions[node.id] || node.label}
            </SelectItem>
          ))
        ) : (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
            No nodes available
          </div>
        )}
      </SelectContent>
    </Select>
  );
};

export default NodeSelector;
import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Group } from 'three';
import { animationConfig } from '../utils';
import { useSpring, a } from '@react-spring/three';
import { Sphere } from './nodes/Sphere';
import { Label } from './Label';
import {
  NodeContextMenuProps,
  ContextMenuEvent,
  InternalGraphNode,
  NodeRenderer,
  CollapseProps
} from '../types';
import { Html, useCursor } from 'glodrei';
import { useCameraControls } from '../CameraControls';
import { useStore } from '../store';
import { useDrag } from '../utils/useDrag';
import { Icon } from './nodes';
import { useHoverIntent } from '../utils/useHoverIntent';
import { ThreeEvent } from '@react-three/fiber';

// ... (NodeProps interface remains the same)
export interface NodeProps {
  id: string;
  parents?: string[];
  disabled?: boolean;
  animated?: boolean;
  draggable?: boolean;
  constrainDragging?: boolean;
  labelFontUrl?: string;
  renderNode?: NodeRenderer;
  contextMenu?: (event: ContextMenuEvent) => ReactNode;
  onPointerOver?: (
    node: InternalGraphNode,
    event: ThreeEvent<PointerEvent>
  ) => void;
  onPointerOut?: (
    node: InternalGraphNode,
    event: ThreeEvent<PointerEvent>
  ) => void;
  onClick?: (
    node: InternalGraphNode,
    props?: CollapseProps,
    event?: ThreeEvent<MouseEvent>
  ) => void;
  onDoubleClick?: (
    node: InternalGraphNode,
    event: ThreeEvent<MouseEvent>
  ) => void;
  onContextMenu?: (
    node?: InternalGraphNode,
    props?: NodeContextMenuProps
  ) => void;
  onDragged?: (node: InternalGraphNode) => void;
}


export const Node: FC<NodeProps> = ({
  animated,
  disabled,
  id,
  draggable = false,
  labelFontUrl,
  contextMenu,
  onClick,
  onDoubleClick,
  onPointerOver,
  onDragged,
  onPointerOut,
  onContextMenu,
  renderNode,
  constrainDragging
}) => {
  const cameraControls = useCameraControls();
  const theme = useStore(state => state.theme);
  const node = useStore(state => state.nodes.find(n => n.id === id));
  const edges = useStore(state => state.edges);
  const draggingIds = useStore(state => state.draggingIds);
  const collapsedNodeIds = useStore(state => state.collapsedNodeIds);
  const addDraggingId = useStore(state => state.addDraggingId);
  const removeDraggingId = useStore(state => state.removeDraggingId);
  const setHoveredNodeId = useStore(state => state.setHoveredNodeId);
  
  // -> Add this line to get the setter function
  const setIsNodeHovered = useStore(state => state.setIsNodeHovered);

  const setNodePosition = useStore(state => state.setNodePosition);
  const setCollapsedNodeIds = useStore(state => state.setCollapsedNodeIds);
  const selections = useStore(state => state.selections);
  const isCollapsed = useStore(state => state.collapsedNodeIds.includes(id));
  const isActive = useStore(state => state.actives?.includes(id));
  const center = useStore(state => state.centerPosition);
  const cluster = useStore(state => state.clusters.get(node.cluster));

  // ... (no changes in the middle of the component)
  const isSelected = selections?.includes(id);
  const hasSelections = selections?.length > 0;

  const isDraggingCurrent = draggingIds.includes(id);
  const isDragging = draggingIds.length > 0;

  const {
    position,
    label,
    subLabel,
    size: nodeSize = 7,
    labelVisible = true
  } = node;

  const group = useRef<Group | null>(null);
  const [active, setActive] = useState<boolean>(false);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);

  // This logic checks if the node is part of a selected edge.
  const isEndpointOfSelectedEdge = useMemo(() => {
    if (!hasSelections) return false;

    for (const selection of selections) {
      if (selection.includes('|||')) {
        const [sourceId, targetId] = selection.split('|||');
        if (id === sourceId || id === targetId) {
          return true;
        }
      }
    }

    return false;
  }, [id, selections, hasSelections]);

  // Determine if the node should be visually highlighted (full opacity)
  const shouldHighlight = active || isSelected || isActive || isEndpointOfSelectedEdge;
  
  // Determine if the node should use its "active" color (e.g., on hover or drag)
  // Selection state (`isSelected`) is intentionally omitted here to prevent color changes on selection.
  const useActiveColor = active || isActive || isDraggingCurrent;

  const selectionOpacity = hasSelections
    ? shouldHighlight
      ? theme.node.selectedOpacity
      : theme.node.inactiveOpacity
    : theme.node.opacity;

  const canCollapse = useMemo(() => {
    // If the node has outgoing edges, it can collapse via context menu
    const outboundLinks = edges.filter(l => l.source === id);

    return outboundLinks.length > 0 || isCollapsed;
  }, [edges, id, isCollapsed]);

  const onCollapse = useCallback(() => {
    if (canCollapse) {
      if (isCollapsed) {
        setCollapsedNodeIds(collapsedNodeIds.filter(p => p !== id));
      } else {
        setCollapsedNodeIds([...collapsedNodeIds, id]);
      }
    }
  }, [canCollapse, collapsedNodeIds, id, isCollapsed, setCollapsedNodeIds]);

  const [{ nodePosition, labelPosition, subLabelPosition }] = useSpring(
    () => ({
      from: {
        nodePosition: center ? [center.x, center.y, 0] : [0, 0, 0],
        labelPosition: [0, -(nodeSize + 7), 20],
        subLabelPosition: [0, -(nodeSize + 14), 2]
      },
      to: {
        nodePosition: position
          ? [
            position.x,
            position.y,
            shouldHighlight ? position.z + 1 : position.z
          ]
          : [0, 0, 0],
        labelPosition: [0, -(nodeSize + 7), 20],
        subLabelPosition: [0, -(nodeSize + 14), 2]
      },
      config: {
        ...animationConfig,
        duration: animated && !isDragging ? undefined : 0
      }
    }),
    [isDraggingCurrent, position, animated, nodeSize, shouldHighlight]
  );

  const bind = useDrag({
    draggable,
    position,
    // If dragging is constrained to the cluster, use the cluster's position as the bounds
    bounds: constrainDragging ? cluster?.position : undefined,
    // @ts-ignore
    set: pos => setNodePosition(id, pos),
    onDragStart: () => {
      addDraggingId(id);
      setActive(true);
    },
    onDragEnd: () => {
      removeDraggingId(id);
      onDragged?.(node);
    }
  });

  useCursor(active && !isDragging && onClick !== undefined, 'pointer');
  useCursor(
    active && draggable && !isDraggingCurrent && onClick === undefined,
    'grab'
  );
  useCursor(isDraggingCurrent, 'grabbing');

  const color = useActiveColor
    ? theme.node.activeFill
    : node.fill || theme.node.fill;


  const { pointerOver, pointerOut } = useHoverIntent({
    disabled: disabled || isDraggingCurrent,
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      cameraControls.freeze();
      setActive(true);
      onPointerOver?.(node, event);
      setHoveredNodeId(id);
      // -> Add this line
      setIsNodeHovered(true);
    },
    onPointerOut: (event: ThreeEvent<PointerEvent>) => {
      cameraControls.unFreeze();
      setActive(false);
      onPointerOut?.(node, event);
      setHoveredNodeId(null);
      // -> Add this line
      setIsNodeHovered(false);
    }
  });

  // ... (rest of the file is unchanged)
  const nodeComponent = useMemo(
    () =>
      renderNode ? (
        renderNode({
          id,
          color,
          size: nodeSize,
          active: useActiveColor,
          opacity: selectionOpacity,
          animated,
          selected: isSelected,
          node
        })
      ) : (
        <>
          {node.icon ? (
            <Icon
              id={id}
              image={node.icon || ''}
              size={nodeSize + 8}
              opacity={selectionOpacity}
              animated={animated}
              color={color}
              node={node}
              active={useActiveColor}
              selected={isSelected}
            />
          ) : (
            <Sphere
              id={id}
              size={nodeSize}
              opacity={selectionOpacity}
              animated={animated}
              color={color}
              node={node}
              active={useActiveColor}
              selected={isSelected}
            />
          )}
        </>
      ),
    [
      renderNode,
      id,
      color,
      nodeSize,
      useActiveColor,
      selectionOpacity,
      animated,
      isSelected,
      node
    ]
  );

  const labelComponent = useMemo(
    () =>
      labelVisible &&
      (labelVisible || isSelected || active) &&
      label && (
        <>
          <a.group position={labelPosition as any}>
            <Label
              text={label}
              fontUrl={labelFontUrl}
              opacity={selectionOpacity}
              stroke={theme.node.label.stroke}
              active={isSelected || active || isDraggingCurrent || isActive}
              color={
                // Color changes only on hover/drag, not selection
                active || isDraggingCurrent || isActive
                  ? theme.node.label.activeColor
                  : theme.node.label.color
              }
            />
          </a.group>
          {subLabel && (
            <a.group position={subLabelPosition as any}>
              <Label
                text={subLabel}
                fontUrl={labelFontUrl}
                fontSize={5}
                opacity={selectionOpacity}
                stroke={theme.node.subLabel?.stroke}
                active={isSelected || active || isDraggingCurrent || isActive}
                color={
                  // Color changes only on hover/drag, not selection
                  active || isDraggingCurrent || isActive
                    ? theme.node.subLabel?.activeColor
                    : theme.node.subLabel?.color
                }
              />
            </a.group>
          )}
        </>
      ),
    [
      active,
      isActive,
      isDraggingCurrent,
      isSelected,
      label,
      labelFontUrl,
      labelPosition,
      labelVisible,
      selectionOpacity,
      subLabel,
      subLabelPosition,
      theme.node.label.activeColor,
      theme.node.label.color,
      theme.node.label.stroke,
      theme.node.subLabel?.activeColor,
      theme.node.subLabel?.color,
      theme.node.subLabel?.stroke
    ]
  );

  const menuComponent = useMemo(
    () =>
      menuVisible &&
      contextMenu && (
        <Html prepend={true} center={true}>
          {contextMenu({
            data: node,
            canCollapse,
            isCollapsed,
            onCollapse,
            onClose: () => setMenuVisible(false)
          })}
        </Html>
      ),
    [menuVisible, contextMenu, node, canCollapse, isCollapsed, onCollapse]
  );

  return (
    <a.group
      renderOrder={1}
      userData={{ id, type: 'node' }}
      ref={group}
      position={nodePosition as any}
      onPointerOver={pointerOver}
      onPointerOut={pointerOut}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        if (!disabled && !isDraggingCurrent) {
          onClick?.(
            node,
            {
              canCollapse,
              isCollapsed
            },
            event
          );
        }
      }}
      onDoubleClick={(event: ThreeEvent<MouseEvent>) => {
        if (!disabled && !isDraggingCurrent) {
          onDoubleClick?.(node, event);
        }
      }}
      onContextMenu={() => {
        if (!disabled) {
          setMenuVisible(true);
          onContextMenu?.(node, {
            canCollapse,
            isCollapsed,
            onCollapse
          });
        }
      }}
      {...(bind() as any)}
    >
      {nodeComponent}
      {menuComponent}
      {labelComponent}
    </a.group>
  );
};
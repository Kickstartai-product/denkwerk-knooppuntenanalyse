import React, { FC, useMemo, useState } from 'react';
import { useSpring, a } from '@react-spring/three';
import { Arrow, EdgeArrowPosition } from './Arrow';
import { Label } from './Label';
import {
  animationConfig,
  calculateEdgeCurveOffset,
  getArrowSize,
  getArrowVectors,
  getCurve,
  getLabelOffsetByType,
  getMidPoint,
  getVector
} from '../utils';
import { Line } from './Line';
import { useStore } from '../store';
import { ContextMenuEvent, InternalGraphEdge, InternalGraphNode } from '../types';
import { Html, useCursor } from 'glodrei';
import { useHoverIntent } from '../utils/useHoverIntent';
import { Euler, Vector3 } from 'three';
import { ThreeEvent } from '@react-three/fiber';

// ... (Mappings and other constants remain the same)
const THREAT_TOPIC_TO_CATEGORY: Record<string, string> = {
    'Overstroming zee': 'Ecologisch',
    'Pandemie door een mens overdraagbaar virus': 'Gezondheid',
    'IS grijpt de macht in Marokko': 'Geopolitiek & militair',
    'Inzet van kernwapens Saoedi-Arabië – Iran': 'Geopolitiek & militair',
    'Geïnduceerde aardbeving': 'Ecologisch',
    'Keteneffecten elektriciteitsuitval': 'Technologisch & digitaal',
    'Chinese hereniging Taiwan': 'Geopolitiek & militair',
    'Tijdelijke bezetting van een EU-lidstaat': 'Geopolitiek & militair',
    'Overstroming rivier': 'Ecologisch',
    'Griep pandemie': 'Gezondheid',
    'Uiteenvallen van de NAVO': 'Geopolitiek & militair',
    'Systeempartij in de financiële sector in zwaar weer': 'Economisch',
    'Hitte/droogte': 'Ecologisch',
    'Onzekerheid energievoorziening': 'Economisch',
    'Aanval Cloud Service Provider': 'Technologisch & digitaal',
    'Kerncentrale Borssele': 'Technologisch & digitaal',
    'Treinramp met gaswolkbrand': 'Technologisch & digitaal',
    'Ransomware telecom': 'Technologisch & digitaal',
    'Handelsoorlog waar de EU bij betrokken is': 'Economisch',
    'Meervoudige terroristische aanslag': 'Sociaal & Maatschappelijk',
    'Verstoring van het betalingsverkeer': 'Economisch',
    'Staatlijke verwerving van een belang in grote telecom-aanbieder': 'Economisch',
    'Infiltratie openbaar bestuur': 'Sociaal & Maatschappelijk',
    'Sneeuwstorm': 'Ecologisch',
    'Crisis in de Zuid-Chinese Zee': 'Geopolitiek & militair',
    'Tweespalt in de EU': 'Geopolitiek & militair',
    'Crimineel geweld richting media en overheid': 'Sociaal & Maatschappelijk',
    'Ongewenste buitenlandse inmenging in diasporagemeenschappen': 'Sociaal & Maatschappelijk',
    'Bestorming en gijzeling Tweede Kamer': 'Sociaal & Maatschappelijk',
    'Landelijke black-out': 'Technologisch & digitaal',
    '(heimelijke) beïnvloeding en hybride operaties door statelijke actoren die aangrijpen op het maatschappelijk debat': 'Geopolitiek & militair',
    'polarisatie rond complottheorieën': 'Sociaal & Maatschappelijk',
    'Desintegratie van Bosnië-Herzegovina': 'Geopolitiek & militair',
    'Griep epidemie': 'Gezondheid',
    'Verstoring van handel door productieproblemen buitenland': 'Economisch',
    'Natuurbranden': 'Ecologisch',
    'Stralingsongeval in Europa': 'Technologisch & digitaal',
    'Falen opslagtank ammoniak': 'Technologisch & digitaal',
    'Europese schuldencrisis': 'Economisch',
    'Cyberaanvallen kritieke infrastructuur': 'Technologisch & digitaal',
    'Ransomware zorgsector': 'Technologisch & digitaal',
    'Terroristische aanslag met een bio-wapen': 'Gezondheid',
    'Uiteenspatten van de OVSE': 'Geopolitiek & militair',
    'Aanval op pride evenement': 'Sociaal & Maatschappelijk',
    'Natuurlijke aardbeving': 'Ecologisch',
    'Geweldsescalatie rechtsextremisten': 'Sociaal & Maatschappelijk',
    'Anarcho-extremisme': 'Sociaal & Maatschappelijk',
    'Buitenlandse regulering techbedrijven': 'Economisch',
    'Ondermijnende enclaves': 'Sociaal & Maatschappelijk',
    'Cyberspionage overheid': 'Technologisch & digitaal',
    'Georganiseerde criminaliteit door heel Nederland': 'Sociaal & Maatschappelijk',
    'Uitbraak MKZ onder koeien': 'Gezondheid',
    'Klassieke statelijke spionage': 'Geopolitiek & militair',
    'Innovatie nucleaire overbrengingsmiddelen': 'Geopolitiek & militair',
    'Correctie op waardering financiële activa': 'Economisch',
    'Misconfiguratie Internetdienstverlener': 'Technologisch & digitaal',
    'Criminele inmenging bedrijfsleven': 'Sociaal & Maatschappelijk',
    'Anti-overheidsextremisme': 'Sociaal & Maatschappelijk',
    'Collateral damage': 'Geopolitiek & militair',
    'Uitbraak zoönotische variant vogelgriep': 'Gezondheid',
    'Tekorten essentiële grondstoffen': 'Economisch',
    'Overname van bedrijf dat o.a. dual-use goederen produceert': 'Economisch',
    'Alleenhandelende dader': 'Sociaal & Maatschappelijk',
    'Buitenlandse durfkapitaalinvesteringen in startups': 'Economisch',
    'Tekort aan drinkwater door verzilting en vervuiling': 'Ecologisch',
    'Gebruik van generatieve AI voor deepfakes en desinformatie': 'Technologisch & digitaal',
    'Sabotage van onderzeese infrastructuur (zoals internetkabels)': 'Technologisch & digitaal',
    'Sabotage van GNSS-signalen': 'Technologisch & digitaal',
    'Verarming biodiversiteit met effecten op voedselzekerheid': 'Ecologisch',
    'Verzwakking van cryptografie door quantumtechnologie': 'Technologisch & digitaal',
    'Verdere militarisering van de ruimte en risico op satellietaanvallen': 'Geopolitiek & militair',
    'Strategische afhankelijkheden grondstoffen en technologie van buitenlande leveranciers': 'Economisch'
};

export const THREAT_TOPIC_TO_CATEGORY_LOWER: Record<string, string> = Object.fromEntries(
  Object.entries(THREAT_TOPIC_TO_CATEGORY).map(([key, value]) => [key.toLowerCase(), value])
);

const CATEGORY_COLORS: Record<string, string> = {
  'Sociaal & Maatschappelijk': '#0699a9',
  'Economisch': '#702f8e',
  'Ecologisch': '#84b440',
  'Geopolitiek & militair': '#a8aaad',
  'Technologisch & digitaal': '#abccd5',
  'Gezondheid': '#e42259'
};
const DEFAULT_EDGE_COLOR = '#D3D3D3';
const getNodeCategorizedColor = (node: InternalGraphNode, defaultColor: string): string => {
  if (node && typeof node.id === 'string') {
    const category = THREAT_TOPIC_TO_CATEGORY_LOWER[node.id.toLowerCase()];
    return CATEGORY_COLORS[category] || CATEGORY_COLORS['unknown'];
  }
  return defaultColor;
};

export interface EdgeProps {
  labelFontUrl?: string;
  id: string;
  animated?: boolean;
  disabled?: boolean;
  labelPlacement?: EdgeLabelPosition;
  arrowPlacement?: EdgeArrowPosition;
  interpolation: EdgeInterpolation;
  contextMenu?: (event: Partial<ContextMenuEvent>) => React.ReactNode;
  onClick?: (edge: InternalGraphEdge, event: ThreeEvent<MouseEvent>) => void;
  onContextMenu?: (edge?: InternalGraphEdge) => void;
  onPointerOver?: (edge: InternalGraphEdge, event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (edge: InternalGraphEdge, event: ThreeEvent<PointerEvent>) => void;
}

const LABEL_PLACEMENT_OFFSET = 3;
const HOVER_COLOR = '#FF8C42';

export const Edge: FC<EdgeProps> = ({
  animated,
  arrowPlacement = 'end',
  contextMenu,
  disabled,
  labelPlacement = 'inline',
  id,
  interpolation,
  labelFontUrl,
  onContextMenu,
  onClick,
  onPointerOver,
  onPointerOut
}) => {
  const theme = useStore(state => state.theme);
  const isDragging = useStore(state => state.draggingIds.length > 0);
  // -> Add this line to get the hover state
  const isNodeHovered = useStore(state => state.isNodeHovered);
  const edges = useStore(state => state.edges);
  const center = useStore(state => state.centerPosition);
  const [active, setActive] = useState<boolean>(false);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);

  // ... (no changes in the middle of the component)
  const edge = edges.find(e => e.id === id);
  if (!edge) return null;

  const { target, source, label, labelVisible = false, size = 1, weight } = edge;

  const from = useStore(store => store.nodes.find(node => node.id === source));
  const to = useStore(store => store.nodes.find(node => node.id === target));
  if (!from || !to) return null;

  const sourceNodeColor = useMemo(() => getNodeCategorizedColor(from, DEFAULT_EDGE_COLOR), [from]);
  const targetNodeColor = useMemo(() => getNodeCategorizedColor(to, DEFAULT_EDGE_COLOR), [to]);

  const labelOffset = (size + theme.edge.label.fontSize) / 2;
  const [arrowLength, arrowSize] = useMemo(() => getArrowSize(size), [size]);
  const { curveOffset, curved } = useMemo(
    () => calculateEdgeCurveOffset({ edge, edges, curved: interpolation === 'curved' }),
    [edge, edges, interpolation]
  );

  const [curve, arrowPosition, arrowRotation] = useMemo(() => {
    const fromVector = getVector(from);
    const fromOffset = from.size;
    const toVector = getVector(to);
    const toOffset = to.size;

    let aCurve = getCurve(fromVector, fromOffset, toVector, toOffset, curved, curveOffset);
    const [arrPos, arrRot] = getArrowVectors(arrowPlacement, aCurve, arrowLength);

    if (arrowPlacement === 'end') {
      aCurve = getCurve(fromVector, fromOffset, arrPos, 0, curved, curveOffset);
    }
    return [aCurve, arrPos, arrRot];
  }, [from, to, curved, curveOffset, arrowPlacement, arrowLength]);

  const midPoint = useMemo(() => {
    let newMidPoint = getMidPoint(from.position, to.position, getLabelOffsetByType(labelOffset, labelPlacement));
    if (curved) {
      const offset = new Vector3().subVectors(newMidPoint, curve.getPoint(0.5));
      if (labelPlacement === 'above') offset.y -= LABEL_PLACEMENT_OFFSET;
      if (labelPlacement === 'below') offset.y += LABEL_PLACEMENT_OFFSET;
      newMidPoint = newMidPoint.sub(offset);
    }
    return newMidPoint;
  }, [from.position, to.position, labelOffset, labelPlacement, curved, curve]);

  // Selections are now driven by the central `selections` array in the store.
  const selections = useStore(state => state.selections);
  const isSelected = useMemo(() => selections?.includes(id), [selections, id]);
  const hasSelection = useMemo(() => selections?.length > 0, [selections]);

  const selectionOpacity = useMemo(() => {
    if (hasSelection) {
      // A node is a string that does not have the substring '|||'.
      const selectedNode = selections.find(s => !s.includes('|||'));
      if (selectedNode) {
        // If the edge `id` contains the `selectedNode` string, make it opaque.
        return id.includes(selectedNode) ? 1 : 0.1;
      }
      // Fallback for edge selections
      return isSelected ? 1 : 0.1;
    } else {
      // When no selections, calculate opacity based on weight.
      const currentEdgeWeight = weight !== undefined && weight !== null ? Number(weight) : 1;
      switch (currentEdgeWeight) {
        case 1: return 0.1;
        case 3: return 0.2;
        case 9: return 0.3;
        case 27: return 0.5;
        case 81: return 0.8;
        default: return theme.edge.opacity;
      }
    }
  }, [hasSelection, isSelected, selections, id, weight, theme.edge.opacity]);

  const [{ labelPosition }] = useSpring(() => ({
    from: { labelPosition: center ? [center.x, center.y, center.z] : [0, 0, 0] },
    to: { labelPosition: [midPoint.x, midPoint.y, midPoint.z] },
    config: { ...animationConfig, duration: animated && !isDragging ? undefined : 0 }
  }), [midPoint, animated, isDragging]);

  const labelRotation = useMemo(() => new Euler(0, 0,
    labelPlacement === 'natural' ? 0 : Math.atan((to.position.y - from.position.y) / (to.position.x - from.position.x))
  ), [to.position.x, to.position.y, from.position.x, from.position.y, labelPlacement]);


  // -> Modify the useCursor hook to respect the hover state
  useCursor(active && !isDragging && !!onClick && !isNodeHovered, 'pointer');

  const { pointerOver, pointerOut } = useHoverIntent({
    disabled,
    onPointerOver: (event) => { setActive(true); onPointerOver?.(edge, event); },
    onPointerOut: (event) => { setActive(false); onPointerOut?.(edge, event); }
  });

  // ...
  const arrowComponent = useMemo(() => arrowPlacement !== 'none' && (
    <Arrow
      animated={false}
      color={active ? HOVER_COLOR : targetNodeColor}
      length={arrowLength}
      opacity={active ? 1 : selectionOpacity}
      position={arrowPosition}
      rotation={arrowRotation}
      size={arrowSize}
      onActive={setActive}
      onContextMenu={() => { if (!disabled) { setMenuVisible(true); onContextMenu?.(edge); }}}
    />
  ), [animated, active, targetNodeColor, arrowLength, arrowPlacement, arrowPosition, arrowRotation, arrowSize, disabled, edge, onContextMenu, selectionOpacity]);

  const labelComponent = useMemo(() => labelVisible && label && (
    <a.group position={labelPosition as any} onContextMenu={() => { if (!disabled) { setMenuVisible(true); onContextMenu?.(edge); }}} onPointerOver={pointerOver} onPointerOut={pointerOut}>
      <Label
        text={label}
        ellipsis={15}
        fontUrl={labelFontUrl}
        stroke={theme.edge.label.stroke}
        color={ isSelected || active ? theme.edge.label.activeColor : theme.edge.label.color }
        opacity={active ? 1 : selectionOpacity}
        fontSize={theme.edge.label.fontSize}
        rotation={labelRotation}
      />
    </a.group>
  ), [active, disabled, edge, isSelected, label, labelFontUrl, labelPosition, labelRotation, labelVisible, onContextMenu, pointerOut, pointerOver, selectionOpacity, theme.edge.label.activeColor, theme.edge.label.color, theme.edge.label.fontSize, theme.edge.label.stroke]);
  
  const menuComponent = useMemo(() => menuVisible && contextMenu && (
    <Html prepend center position={midPoint}>
      {contextMenu({ data: edge, onClose: () => setMenuVisible(false) })}
    </Html>
  ), [menuVisible, contextMenu, midPoint, edge]);

  const handleEdgeClick = (event: ThreeEvent<MouseEvent>) => {
    // -> Restore the logic but add a check for isNodeHovered
    if (disabled || isNodeHovered) return;

    event.stopPropagation();
    onClick?.(edge, event);
  };

  return (
    <group>
      <Line
        id={id}
        curve={curve}
        curved={curved}
        curveOffset={curveOffset}
        animated={false}
        opacity={active ? 1 : selectionOpacity}
        size={size}
        sourceColor={active ? HOVER_COLOR : sourceNodeColor}
        targetColor={active ? HOVER_COLOR : targetNodeColor}
        // -> Restore the onClick handler
        onClick={handleEdgeClick}
        onPointerOver={pointerOver}
        onPointerOut={pointerOut}
        onContextMenu={() => { if (!disabled) { setMenuVisible(true); onContextMenu?.(edge); }}}
      />
      {arrowComponent}
      {labelComponent}
      {menuComponent}
    </group>
  );
};
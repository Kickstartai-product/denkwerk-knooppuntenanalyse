import React, { FC, useEffect, useMemo, useRef } from 'react';
import { useSpring, a } from '@react-spring/three';
import { animationConfig, getCurve } from '../utils';
import {
  Vector3,
  TubeGeometry,
  ColorRepresentation,
  Color,
  Curve,
  BufferAttribute
} from 'three';
import { useStore } from '../store';
import { ThreeEvent } from '@react-three/fiber';

const TUBULAR_SEGMENTS = 20;
const RADIAL_SEGMENTS = 5;

export interface LineProps {
  animated?: boolean;
  sourceColor?: ColorRepresentation;
  targetColor?: ColorRepresentation;
  curved: boolean;
  curve: Curve<Vector3>;
  id: string;
  opacity?: number;
  size?: number;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  onContextMenu?: () => void;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
  curveOffset?: number;
}

export const Line: FC<LineProps> = ({
  curveOffset,
  animated,
  sourceColor = '#fff',
  targetColor = '#fff',
  curve,
  curved = false,
  id,
  opacity = 1,
  size = 1,
  onContextMenu,
  onClick,
  onPointerOver,
  onPointerOut
}) => {
  const tubeRef = useRef<TubeGeometry | null>(null);
  const paddingTubeRef = useRef<TubeGeometry | null>(null);
  const isDragging = useStore(state => state.draggingIds.length > 0);
  const center = useStore(state => state.centerPosition);
  const mounted = useRef<boolean>(false);

  // Memoize both source and target THREE.Color objects
  const threeSourceColor = useMemo(() => new Color(sourceColor), [sourceColor]);
  const threeTargetColor = useMemo(() => new Color(targetColor), [targetColor]);

  const { lineOpacity } = useSpring({
    from: { lineOpacity: 0 },
    to: { lineOpacity: opacity },
    config: { ...animationConfig, duration: animated ? undefined : 0 }
  });

  // Function to apply gradient colors to geometry
  const applyGradientColors = (geometry: TubeGeometry) => {
    const numVertices = geometry.attributes.position.count;
    const colors = new Float32Array(numVertices * 3);
    const color = new Color();

    for (let i = 0; i <= TUBULAR_SEGMENTS; i++) {
      const t = i / TUBULAR_SEGMENTS;
      color.copy(threeSourceColor).lerp(threeTargetColor, t);

      for (let j = 0; j <= RADIAL_SEGMENTS; j++) {
        const vertexIndex = i * (RADIAL_SEGMENTS + 1) + j;
        if (vertexIndex < numVertices) {
          colors.set([color.r, color.g, color.b], vertexIndex * 3);
        }
      }
    }
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
  };

  useSpring(() => {
    const from = curve.getPoint(0);
    const to = curve.getPoint(1);
    return {
      from: {
        fromVertices: !mounted.current && center ? [center.x, center.y, center.z] : [from.x, from.y, from.z],
        toVertices: !mounted.current && center ? [center.x, center.y, center.z] : [to.x, to.y, to.z]
      },
      to: {
        fromVertices: [from.x, from.y, from.z],
        toVertices: [to.x, to.y, to.z]
      },
      onChange: event => {
        if (!tubeRef.current || !paddingTubeRef.current) return;

        const { fromVertices, toVertices } = event.value;
        const fromVector = new Vector3(...fromVertices);
        const toVector = new Vector3(...toVertices);

        const animatedCurve = getCurve(fromVector, 0, toVector, 0, curved, curveOffset);
        
        // Create visible geometry
        const newGeometry = new TubeGeometry(animatedCurve, TUBULAR_SEGMENTS, size / 2, RADIAL_SEGMENTS, false);
        
        // Calculate dynamic padding - smaller edges get proportionally more padding
        // Size 4 = 0 padding, size 3 = 1x padding, size 2 = 2x padding, etc.
        const baseLine = 4; // Size that gets 0 padding
        const normalizedSize = Math.max(0, Math.min(baseLine, size));
        
        // Simple inverse: padding = (4 - size), so size 4=0, size 3=1, size 2=2, etc.
        const paddingMultiplier = 4//  Math.max(0, baseLine - normalizedSize);
        const paddingRadius = (size * paddingMultiplier) / 2;
        
        // Create invisible padding geometry with dynamic sizing
        const paddingGeometry = new TubeGeometry(animatedCurve, TUBULAR_SEGMENTS, paddingRadius, RADIAL_SEGMENTS, false);

        // Apply gradient colors to the visible geometry
        applyGradientColors(newGeometry);

        // Copy the new geometries to our refs
        tubeRef.current.copy(newGeometry);
        paddingTubeRef.current.copy(paddingGeometry);
        
        // Clean up
        newGeometry.dispose();
        paddingGeometry.dispose();
      },
      config: {
        ...animationConfig,
        duration: animated && !isDragging ? undefined : 0
      }
    };
  }, [animated, isDragging, curve, size, curved, curveOffset, threeSourceColor, threeTargetColor, center]);

  // Force re-render when colors change by updating the geometry
  useEffect(() => {
    if (tubeRef.current && mounted.current) {
      applyGradientColors(tubeRef.current);
      // Mark the color attribute as needing an update
      if (tubeRef.current.attributes.color) {
        tubeRef.current.attributes.color.needsUpdate = true;
      }
    }
  }, [threeSourceColor, threeTargetColor]);

  useEffect(() => {
    mounted.current = true;
  }, []);

  return (
    <group userData={{ id, type: 'edge' }}>
      {/* Invisible padding mesh for improved hover detection */}
      <mesh
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
        onPointerDown={event => {
          if (event.nativeEvent.buttons === 2) {
            event.stopPropagation();
            onContextMenu?.();
          }
        }}
      >
        <tubeGeometry ref={paddingTubeRef} />
        <meshBasicMaterial
          transparent={true}
          opacity={0}
          visible={false}
        />
      </mesh>
      
      {/* Visible tube mesh */}
      <mesh>
        <tubeGeometry ref={tubeRef} />
        <a.meshBasicMaterial
          opacity={lineOpacity}
          fog={true}
          transparent={true}
          depthTest={false}
          vertexColors={true}
        />
      </mesh>
    </group>
  );
};
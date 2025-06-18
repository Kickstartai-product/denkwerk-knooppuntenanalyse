import React, { useState, useEffect, useMemo, useRef } from 'react';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
}

interface Edge {
  from: Node;
  to: Node;
  length: number;
}

const ClimateImpactGraph: React.FC = () => {
  const [startAnimation, setStartAnimation] = useState(false);
  const [showOuterNodes, setShowOuterNodes] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState('');


  // Denkwerk brand color
  const brandColor = 'rgb(0, 153, 168)';
  const textColor = '#000000'; // Black text

  // Intersection Observer to detect when fully in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Start animation when at least 80% of the component is visible
        if (entry.isIntersecting && entry.intersectionRatio >= 0.8) {
          setIsInView(true);
        }
      },
      {
        threshold: 0.8, // Trigger when 80% of the component is visible
        rootMargin: '0px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Only start animations when component is in view
  useEffect(() => {
    if (!isInView) return;

    const initialTimer = setTimeout(() => setStartAnimation(true), 200);
    const arrowTimer = setTimeout(() => setShowArrows(true), 1200); // Show arrows after lines finish
    const nodeTimer = setTimeout(() => setShowOuterNodes(true), 1600); // Show nodes after arrows
    
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(arrowTimer);
      clearTimeout(nodeTimer);
    };
  }, [isInView]);
  
  // A common fix for Safari is to use an absolute URL for the marker reference.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPath(window.location.href);
    }
  }, []);


  const { nodes, edges } = useMemo(() => {
    const width = 500;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const orbitRadius = 160; // Increased from 140

    const nodeData: Record<string, Node> = {
      central: { 
        id: 'central', 
        label: 'Hitte/Droogte', 
        x: centerX, 
        y: centerY, 
        radius: 50 // Slightly reduced from 55
      },
      top: { 
        id: 'top', 
        label: 'Natuurbranden', 
        x: centerX, 
        y: centerY - orbitRadius, 
        radius: 35 // Slightly reduced from 38
      },
      bottomLeft: {
        id: 'bottomLeft',
        label: 'Verlies biodiversiteit',
        x: centerX - orbitRadius * 0.87,
        y: centerY + orbitRadius * 0.5,
        radius: 35, // Slightly reduced from 38
      },
      bottomRight: {
        id: 'bottomRight',
        label: 'Overstroming',
        x: centerX + orbitRadius * 0.87,
        y: centerY + orbitRadius * 0.5,
        radius: 35, // Slightly reduced from 38
      },
    };

    const edgeData: Omit<Edge, 'length'>[] = [
      { from: nodeData.central, to: nodeData.top },
      { from: nodeData.central, to: nodeData.bottomLeft },
      { from: nodeData.central, to: nodeData.bottomRight },
    ];
    
    const finalEdges: Edge[] = edgeData.map(edge => {
      const dx = edge.to.x - edge.from.x;
      const dy = edge.to.y - edge.from.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      return { ...edge, length };
    });

    return { nodes: nodeData, edges: finalEdges };
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto my-12">
      <svg 
        viewBox="0 0 500 400" 
        className="w-full h-80 drop-shadow-lg"
        aria-label="A diagram showing the impacts of climate change, specifically heat and drought."
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Flat design gradient for nodes */}
          <radialGradient id="centralGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={brandColor} />
            <stop offset="100%" stopColor={brandColor} />
          </radialGradient>
          
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={brandColor} />
            <stop offset="100%" stopColor={brandColor} />
          </radialGradient>

          {/* The marker has been adjusted to fix the rendering issues.
            - `viewBox` is set to "0 0 10 10".
            - `refX` and `refY` are set to 5, which is the center of the viewBox.
            - `markerWidth` and `markerHeight` are adjusted to 5.
            - `orient` is set to "auto-start-reverse" for proper rotation.
          */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
            fill={brandColor}>
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>

        {/* Render edges with smooth animation */}
        {edges.map((edge, index) => {
          const dx = edge.to.x - edge.from.x;
          const dy = edge.to.y - edge.from.y;
          const unitDx = dx / edge.length;
          const unitDy = dy / edge.length;
          const startX = edge.from.x + unitDx * edge.from.radius;
          const startY = edge.from.y + unitDy * edge.from.radius;
          
          // Back up the arrow slightly so the tip doesn't enter the circle.
          // The offset is added to the radius to shorten the line.
          const arrowTipOffset = 5;
          const endX = edge.to.x - unitDx * (edge.to.radius + arrowTipOffset);
          const endY = edge.to.y - unitDy * (edge.to.radius + arrowTipOffset);

          const lineLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

          return (
            <line
              key={`${edge.from.id}-${edge.to.id}`}
              x1={startX} 
              y1={startY}
              x2={endX} 
              y2={endY}
              stroke={brandColor}
              strokeWidth="4"
              /*
                The marker-end URL now uses the full path to avoid issues with Safari.
              */
              markerEnd={showArrows ? `url(${path}#arrow)` : "none"}
              strokeDasharray={lineLength}
              strokeDashoffset={startAnimation ? 0 : lineLength}
              style={{ 
                transition: `stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
              }}
            />
          );
        })}

        {/* Render nodes with flat design */}
        {Object.values(nodes).map((node, index) => {
          const isCentral = node.id === 'central';
          const isVisible = isCentral || showOuterNodes;
          const delay = isCentral ? 0 : (index - 1) * 0.15;
          
          return (
            <g
              key={node.id}
              style={{
                transformOrigin: `${node.x}px ${node.y}px`,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'scale(1)' : 'scale(0.3)',
                transition: `all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}s`,
              }}
            >
              {/* Simple flat circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={brandColor}
              />
              
              {/* Node text positioned below the circle */}
              <text
                x={node.x}
                y={node.y + node.radius + 20}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={textColor}
                fontSize={isCentral ? "16" : "14"}
                fontWeight="400"
                fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif"
                stroke="white"
                strokeWidth="4"
                paintOrder="stroke fill"
                style={{ 
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}
              >
                {node.label.split('||||').map((word, wordIndex) => (
                  <tspan 
                    key={wordIndex} 
                    x={node.x} 
                    dy={wordIndex > 0 ? "1.1em" : "0"}
                  >
                    {word}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default ClimateImpactGraph;
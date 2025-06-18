// src/components/EdgeLine.tsx

import React from 'react';

interface EdgeLineProps {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    sourceColor: string;
    targetColor: string;
    strokeWidth: number;
    gradientId: string;
}

export const EdgeLine: React.FC<EdgeLineProps> = ({
    x1,
    y1,
    x2,
    y2,
    sourceColor,
    targetColor,
    strokeWidth,
    gradientId,
}) => {
    // We still need to create the marker ID to point to the correct arrowhead
    const markerId = `arrowhead-${targetColor.replace('#', '')}`;

    return (
        <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={`url(#${gradientId})`} // Use the gradient for the stroke
            strokeWidth={strokeWidth}
            markerEnd={`url(#${markerId})`} // Apply the arrowhead
        />
    );
};

export default EdgeLine;
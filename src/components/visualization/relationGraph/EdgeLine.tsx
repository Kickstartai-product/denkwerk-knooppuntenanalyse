// src/components/EdgeLine.tsx

import React from 'react';

interface EdgeLineProps {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    markerId: string;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onClick: () => void;
}

export const EdgeLine: React.FC<EdgeLineProps> = ({
    x1,
    y1,
    x2,
    y2,
    stroke,
    strokeWidth,
    opacity,
    markerId,
    onMouseEnter,
    onMouseLeave,
    onClick,
}) => {
    // Create a hitbox that is 10px wider than the visible line
    const hitboxStrokeWidth = strokeWidth + 10;

    return (
        // Use a group to apply the pointer cursor and hold both lines
        <g style={{ cursor: 'pointer' }} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            {/* 1. The invisible hitbox line (rendered first, so it's "underneath") */}
            {/* This line is wider and captures all mouse events. */}
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="transparent"
                strokeWidth={hitboxStrokeWidth}
            />
            
            {/* 2. The visible line (rendered second, on top of the hitbox) */}
            {/* This line has pointer-events disabled so it doesn't interfere with the hitbox. */}
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={stroke}
                strokeWidth={strokeWidth}
                markerEnd={`url(#${markerId})`}
                opacity={opacity}
                style={{ 
                    transition: 'opacity 0.2s ease, stroke 0.2s ease',
                    pointerEvents: 'none', 
                }}
            />
        </g>
    );
};

export default EdgeLine;
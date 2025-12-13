// src/components/WindStream.jsx
import React, { useMemo } from 'react';

const WindStream = ({ pathId, d, colorStart, colorEnd, speed = 2, intensity = 1, width = 40 }) => {
    // Generate multiple parallel lines to simulate airflow
    const lines = useMemo(
        () =>
            Array.from({ length: 5 }).map((_, i) => ({
                offset: (i - 2) * (width / 6),
                delay: Math.random() * 2,
                dash: 20 + Math.random() * 40,
                gap: 30 + Math.random() * 50,
                opacity: 0.3 + Math.random() * 0.4,
            })),
        [width]
    );

    return (
        <g className="pointer-events-none mix-blend-screen">
            <defs>
                <linearGradient
                    id={`grad-${pathId}`}
                    gradientUnits="userSpaceOnUse"
                    x1="0"
                    y1="0"
                    x2="100%"
                    y2="0"
                >
                    <stop offset="0%" stopColor={colorStart} />
                    <stop offset="100%" stopColor={colorEnd} />
                </linearGradient>
            </defs>
            {/* Streak lines */}
            {lines.map((l, i) => (
                <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={`url(#grad-${pathId})`}
                    strokeWidth={2}
                    strokeDasharray={`${l.dash} ${l.gap}`}
                    strokeLinecap="round"
                    strokeOpacity={l.opacity}
                    transform={`translate(0, ${l.offset})`}
                >
                    <animate
                        attributeName="stroke-dashoffset"
                        from={l.dash + l.gap}
                        to="0"
                        dur={`${1 / speed}s`}
                        repeatCount="indefinite"
                    />
                </path>
            ))}
            {/* Particles */}
            {intensity > 0 &&
                Array.from({ length: 8 }).map((_, i) => {
                    const verticalOffset = (Math.random() - 0.5) * width * 0.8;
                    return (
                        <circle
                            key={`p-${i}`}
                            r={1 + Math.random()}
                            fill="white"
                            opacity="0.6"
                            transform={`translate(0, ${verticalOffset})`}
                        >
                            <animateMotion
                                dur={`${(1.5 + Math.random()) / speed}s`}
                                repeatCount="indefinite"
                                path={d}
                                rotate="auto"
                                begin={`-${Math.random()}s`}
                            />
                            <animate
                                attributeName="opacity"
                                values="0;0.8;0"
                                dur={`${(1.5 + Math.random()) / speed}s`}
                                repeatCount="indefinite"
                            />
                        </circle>
                    );
                })}
        </g>
    );
};

export default WindStream;

import React, { useEffect, useState } from 'react';
import { technologyApi } from '../services/api';

const WIDTH = 800;
const HEIGHT = 800;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const RINGS = [100, 200, 300, 400];
const RING_LABELS = ['Adopt', 'Trial', 'Assess', 'Hold'];
const QUADRANTS = [
  'Techniques',
  'Tools',
  'Platforms',
  'Languages & Frameworks',
];

function polarToCartesian(r: number, angle: number) {
  return {
    x: CENTER_X + r * Math.cos(angle),
    y: CENTER_Y + r * Math.sin(angle),
  };
}

// Simple deterministic hash function for a string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

const ThoughtworksRadar: React.FC = () => {
  const [technologies, setTechnologies] = useState<any[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const fetchTechnologies = async () => {
      try {
        const data = await technologyApi.list();
        setTechnologies(data);
      } catch (error) {
        setTechnologies([]);
      }
    };
    fetchTechnologies();
  }, []);

  // Helper to get quadrant and ring index
  const getQuadrantIndex = (quadrant: string) => QUADRANTS.indexOf(quadrant);
  const getRingIndex = (ring: string) => RING_LABELS.indexOf(ring);

  const outerRadius = RINGS[RINGS.length - 1];

  return (
    <svg width={WIDTH} height={HEIGHT} style={{ background: '#fff' }}>
      <defs>
        {/* Gradient for rings */}
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f5f5f5', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0.2 }} />
        </linearGradient>
        {/* Shadow filter */}
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.07" />
        </filter>
      </defs>

      {/* Background rings with gradient */}
      {RINGS.map((r, i) => (
        <circle
          key={r}
          cx={CENTER_X}
          cy={CENTER_Y}
          r={r}
          fill={i === RINGS.length - 1 ? 'none' : 'url(#ringGradient)'}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      ))}

      {/* Separator lines */}
      <line
        x1={CENTER_X}
        y1={CENTER_Y - outerRadius}
        x2={CENTER_X}
        y2={CENTER_Y + outerRadius}
        stroke="#e0e0e0"
        strokeWidth={0.5}
      />
      <line
        x1={CENTER_X - outerRadius}
        y1={CENTER_Y}
        x2={CENTER_X + outerRadius}
        y2={CENTER_Y}
        stroke="#e0e0e0"
        strokeWidth={0.5}
      />

      {/* Ring labels with improved styling */}
      {RINGS.map((r, i) => (
        <text
          key={i}
          x={CENTER_X}
          y={CENTER_Y - r + 25}
          textAnchor="middle"
          fontSize={14}
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#9e9e9e"
          fontWeight="500"
        >
          {RING_LABELS[i]}
        </text>
      ))}

      {/* Quadrant labels with improved styling */}
      {/* Techniques (top right) */}
      <text
        x={CENTER_X + (outerRadius / 2)}
        y={CENTER_Y - (outerRadius / 2)}
        textAnchor="middle"
        fontSize={16}
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="#525252"
        fontWeight="600"
        letterSpacing="0.5px"
      >
        Techniques
      </text>

      {/* Tools (bottom right) */}
      <text
        x={CENTER_X + (outerRadius / 2)}
        y={CENTER_Y + (outerRadius / 2)}
        textAnchor="middle"
        fontSize={16}
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="#525252"
        fontWeight="600"
        letterSpacing="0.5px"
      >
        Tools
      </text>

      {/* Platforms (bottom left) */}
      <text
        x={CENTER_X - (outerRadius / 2)}
        y={CENTER_Y + (outerRadius / 2)}
        textAnchor="middle"
        fontSize={16}
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="#525252"
        fontWeight="600"
        letterSpacing="0.5px"
      >
        Platforms
      </text>

      {/* Languages & Frameworks (top left) */}
      <text
        x={CENTER_X - (outerRadius / 2)}
        y={CENTER_Y - (outerRadius / 2)}
        textAnchor="middle"
        fontSize={16}
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="#525252"
        fontWeight="600"
        letterSpacing="0.5px"
      >
        Languages & Frameworks
      </text>

      {/* Blips with improved styling */}
      {technologies.map((blip, i) => {
        const quadrantIdx = getQuadrantIndex(blip.quadrant);
        const ringIdx = getRingIndex(blip.ring);
        if (quadrantIdx === -1 || ringIdx === -1) return null;

        // Deterministic hash for this blip
        const hashBase = blip.id || blip.name || `${quadrantIdx}-${ringIdx}-${i}`;
        const hash = hashString(hashBase);

        // Angle range for this quadrant
        let [angleStart, angleEnd] = [
          [-Math.PI / 4, Math.PI / 4],                // Techniques
          [Math.PI / 4, (3 * Math.PI) / 4],          // Tools
          [(3 * Math.PI) / 4, (5 * Math.PI) / 4],    // Platforms
          [(5 * Math.PI) / 4, (7 * Math.PI) / 4],    // Languages & Frameworks
        ][quadrantIdx];

        if (angleEnd <= angleStart) angleEnd += 2 * Math.PI;
        const angle = angleStart + (hash % 1000) / 1000 * (angleEnd - angleStart);

        // Radius range for this ring
        const ringInner = ringIdx === 0 ? 0 : RINGS[ringIdx - 1];
        const ringOuter = RINGS[ringIdx];
        const radius = ringInner + 20 + ((hash >> 10) % 1000) / 1000 * (ringOuter - ringInner - 40);
        const { x, y } = polarToCartesian(radius, angle);

        return (
          <g key={blip.id || i}>
            <circle
              cx={x}
              cy={y}
              r={6}
              fill="#fff"
              stroke="#525252"
              strokeWidth={1.5}
              filter="url(#shadow)"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
            />
            {hovered === i && (
              <g>
                <rect
                  x={x + 12}
                  y={y - 18}
                  width={blip.name.length * 8 + 24}
                  height={36}
                  fill="#fff"
                  stroke="#e0e0e0"
                  strokeWidth={1}
                  rx={8}
                  ry={8}
                  filter="url(#shadow)"
                />
                <text
                  x={x + 24}
                  y={y}
                  fontSize={14}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fill="#525252"
                  fontWeight="500"
                  alignmentBaseline="middle"
                >
                  {blip.name}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default ThoughtworksRadar; 
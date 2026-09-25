import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';
import '../../styles/expertise.css';

const CustomLabel = ({ x, y, payload, cx, cy, isDimmed }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const textAnchor = x > cx ? 'start' : x < cx ? 'end' : 'middle';

  const displayValue = isMobile && payload.value.length > 10
    ? `${payload.value.substring(0, 8)}...`
    : payload.value;

  return (
    <text
      x={x}
      y={y}
      className={`radar-keyword-clean ${isDimmed ? 'dimmed' : ''}`}
      textAnchor={textAnchor}
      dominantBaseline="central"
    >
      {displayValue}
    </text>
  );
};

const AnimatedRadarLayer = ({ data, cx, cy, outerRadius }) => {
  const points = useMemo(() => {
    if (!cx || !cy) return [];
    const angleStep = (Math.PI * 2) / data.length;
    return data.map((d, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const radius = d.score * outerRadius;
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
  }, [data, cx, cy, outerRadius]);

  if (points.length === 0) return null;

  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`;

  return (
    <g style={{ pointerEvents: 'none' }}>
      <defs>
        <radialGradient id="dotGradient">
          <stop offset="30%" stopColor="#fff" />
          <stop offset="100%" stopColor="var(--auburn_orange)" />
        </radialGradient>
      </defs>

      <motion.path
        d={pathData}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ originX: `${cx}px`, originY: `${cy}px` }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        fill="var(--auburn_orange)"
        fillOpacity={0.15}
        stroke="var(--auburn_orange)"
        strokeWidth={2}
      />

      {points.map((p, i) => (
        <g key={i}>
          <motion.circle
            initial={{ cx: cx, cy: cy, opacity: 0 }}
            animate={{ cx: p.x, cy: p.y, opacity: 1 }}
            transition={{
              delay: 0.5 + i * 0.04,
              type: "spring",
              stiffness: 120,
              damping: 15
            }}
            r={4.5}
            fill="url(#dotGradient)"
            stroke="var(--auburn_orange)"
            strokeWidth={1.5}
          >
            <motion.animate
                attributeName="r"
                values="4.5;5.2;4.5"
                dur="2.5s"
                repeatCount="indefinite"
                begin={`${i * 0.15}s`}
            />
          </motion.circle>
        </g>
      ))}
    </g>
  );
};

const ExpertiseRadarChart = ({ data }) => {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDims({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!data || data.length === 0) return null;

  const cx = dims.width / 2;
  const cy = dims.height / 2;
  const outerRadius = dims.width < 600 ? Math.min(cx, cy) * 0.55 : Math.min(cx, cy) * 0.65;

  return (
    <div
      className={`expertise-radar-container ${isHovering ? 'chart-active' : ''}`}
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      tabIndex="-1"
    >
      {dims.width > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius={outerRadius} data={data}>
            <PolarGrid
              className="advanced-grid"
              stroke="var(--auburn_orange)"
              strokeOpacity={0.2}
              gridType="polygon"
            />

            <PolarAngleAxis
              dataKey="subject"
              tick={<CustomLabel cx={cx} cy={cy} isDimmed={isHovering} />}
            />

            <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />

            <Radar
              dataKey="score"
              stroke="transparent"
              fill="transparent"
              isAnimationActive={false}
            />

            <AnimatedRadarLayer
                data={data}
                cx={cx}
                cy={cy}
                outerRadius={outerRadius}
            />

            <Tooltip
              contentStyle={{
                borderRadius: '10px',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                padding: '8px 12px',
                fontSize: '10px',
                fontWeight: '700',
                color: 'var(--auburn_blue)'
              }}
              itemStyle={{ color: 'var(--auburn_orange)' }}
              formatter={(value) => [`${(value * 100).toFixed(0)}%`, 'Score']}
            />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ExpertiseRadarChart;
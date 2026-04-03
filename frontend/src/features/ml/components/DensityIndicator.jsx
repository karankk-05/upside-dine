import React from 'react';
import { motion } from 'framer-motion';
import '../styles/crowd.css';

/**
 * Reusable density badge showing low / moderate / high level with pulsing dot.
 * Props: level ('low'|'moderate'|'high'), className
 */
export default function DensityIndicator({ level = 'low', className = '' }) {
  const labels = { low: 'Low', moderate: 'Moderate', high: 'High' };

  return (
    <motion.span
      className={`density-indicator density-indicator--${level} ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <span className="density-indicator__dot" />
      {labels[level] || level}
    </motion.span>
  );
}

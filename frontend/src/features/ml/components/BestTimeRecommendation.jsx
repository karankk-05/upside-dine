import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Users } from 'lucide-react';
import { useCrowdRecommendation } from '../hooks/useCrowdRecommendation';
import '../styles/crowd.css';

/**
 * Recommendation card showing the best times to visit a mess.
 * Props: messId
 */
export default function BestTimeRecommendation({ messId }) {
  const { data, isLoading, isError } = useCrowdRecommendation(messId);

  if (isLoading) {
    return <div className="skeleton" style={{ height: 180, borderRadius: 16 }} />;
  }

  if (isError || !data) {
    return null;
  }

  const bestTimes = data.best_times || [];

  if (!bestTimes.length) {
    return (
      <div className="recommendation-card">
        <div className="recommendation-card__header">
          <div className="recommendation-card__icon">
            <Lightbulb size={18} color="var(--st-accent)" />
          </div>
          <div>
            <div className="recommendation-card__title">Best Time to Visit</div>
            <div className="recommendation-card__description">Not enough data yet</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="recommendation-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="recommendation-card__header">
        <div className="recommendation-card__icon">
          <Lightbulb size={18} color="var(--st-accent)" />
        </div>
        <div>
          <div className="recommendation-card__title">Best Time to Visit</div>
          <div className="recommendation-card__description">{data.recommendation}</div>
        </div>
      </div>

      <ul className="recommendation-card__list">
        {bestTimes.map((slot, idx) => (
          <motion.li
            key={slot.hour}
            className="recommendation-card__item"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 * (idx + 1) }}
          >
            <div className="recommendation-card__item-rank">{idx + 1}</div>
            <div className="recommendation-card__item-info">
              <div className="recommendation-card__item-time">{slot.time_range}</div>
              <div className="recommendation-card__item-people">
                <Users size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                ~{Math.round(slot.avg_people)} people avg
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

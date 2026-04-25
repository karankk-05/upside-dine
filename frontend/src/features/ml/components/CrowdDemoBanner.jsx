import React from 'react';
import { Sparkles } from 'lucide-react';
import { CROWD_DEMO_LOOP_MINUTES } from '../demo/crowdDemo';
import '../styles/crowd.css';

export default function CrowdDemoBanner({
  message = 'Presentation mode is active. Metrics update gradually on a 10-minute simulation loop.',
}) {
  return (
    <div className="crowd-demo-banner">
      <div className="crowd-demo-banner__pill">
        <Sparkles size={14} />
        Demo Mode
      </div>
      <p className="crowd-demo-banner__text">
        {message.replace('10-minute', `${CROWD_DEMO_LOOP_MINUTES}-minute`)}
      </p>
    </div>
  );
}

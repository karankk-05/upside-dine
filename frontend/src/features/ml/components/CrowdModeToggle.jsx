import React from 'react';
import '../styles/crowd.css';

export default function CrowdModeToggle({ mode, onChange }) {
  return (
    <div className="crowd-mode-toggle">
      <div className="crowd-mode-toggle__header">
        <div>
          <div className="crowd-mode-toggle__title">Feed Mode</div>
          <div className="crowd-mode-toggle__description">
            Switch between the presentation demo and the actual live crowd feed.
          </div>
        </div>
      </div>

      <div className="crowd-mode-toggle__tabs" role="tablist" aria-label="Crowd feed mode">
        {[
          { id: 'demo', label: 'Demo Mode' },
          { id: 'live', label: 'Live Feed' },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={mode === option.id}
            className={`crowd-mode-toggle__tab ${
              mode === option.id ? 'crowd-mode-toggle__tab--active' : ''
            }`}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

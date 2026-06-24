// src/components/ReviewSession/SessionProgress.tsx
import React from 'react'
import './SessionProgress.css'

interface SessionProgressProps {
  current: number
  total: number
  label?: string
}

const SessionProgress: React.FC<SessionProgressProps> = ({
  current,
  total,
  label
}) => {
  const percentage = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="session-progress">
      {label && <span className="progress-label">{label}</span>}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="progress-text">
        {current}/{total} ({percentage.toFixed(0)}%)
      </span>
    </div>
  )
}

export default SessionProgress

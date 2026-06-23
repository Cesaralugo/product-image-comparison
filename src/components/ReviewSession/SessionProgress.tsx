import './SessionProgress.css'

interface SessionProgressProps {
  reviewedCount: number
  totalCount: number
  currentIndex: number
}

const SessionProgress: React.FC<SessionProgressProps> = ({
  reviewedCount,
  totalCount,
  currentIndex,
}) => {
  const progressPercentage = totalCount > 0 ? (reviewedCount / totalCount) * 100 : 0

  return (
    <div className="session-progress">
      <div className="progress-info">
        <span className="progress-text">
          Product {currentIndex + 1} of {totalCount}
        </span>
        <span className="progress-count">
          {reviewedCount} reviewed
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="progress-percentage">{Math.round(progressPercentage)}%</div>
    </div>
  )
}

export default SessionProgress

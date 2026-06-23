import type { ReviewSession } from '@/types'

interface ReportPreviewProps {
  session: ReviewSession
}

const ReportPreview: React.FC<ReportPreviewProps> = ({ session }) => {
  return (
    <div className="report-preview">
      <h2>Report Preview</h2>
      <div className="preview-content">
        <p>Session ID: {session.id}</p>
        <p>Started: {new Date(session.startedAt).toLocaleString()}</p>
        <p>Total Products: {session.productCount}</p>
        <p>Reviewed: {session.reviewedCount}</p>
        <p>Completion: {Math.round((session.reviewedCount / session.productCount) * 100)}%</p>
      </div>
    </div>
  )
}

export default ReportPreview

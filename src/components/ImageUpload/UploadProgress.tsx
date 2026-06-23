interface UploadProgressProps {
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

const UploadProgress: React.FC<UploadProgressProps> = ({ progress, status, error }) => {
  return (
    <div className={`upload-progress status-${status}`}>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p>{progress}%</p>
      {error && <p className="error-message">{error}</p>}
    </div>
  )
}

export default UploadProgress

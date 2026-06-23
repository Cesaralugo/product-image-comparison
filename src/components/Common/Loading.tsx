import './Loading.css'

interface LoadingProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
}

const Loading: React.FC<LoadingProps> = ({ message = 'Loading...', size = 'medium' }) => {
  return (
    <div className={`loading-container loading-${size}`}>
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  )
}

export default Loading

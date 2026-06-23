import { useState, useEffect } from 'react'
import type { ReviewSession } from '@/types'

interface SessionManagerProps {
  session: ReviewSession | null
  onSessionChange: (session: ReviewSession) => void
}

const SessionManager: React.FC<SessionManagerProps> = ({ session, onSessionChange }) => {
  const [sessions, setSessions] = useState<ReviewSession[]>([])

  useEffect(() => {
    // Load sessions from storage
    const loadSessions = async () => {
      // TODO: Load from Tauri backend
    }
    loadSessions()
  }, [])

  const createNewSession = () => {
    const newSession: ReviewSession = {
      id: `session-${Date.now()}`,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      productCount: 0,
      reviewedCount: 0,
      reviews: [],
      status: 'in-progress',
    }
    onSessionChange(newSession)
  }

  return (
    <div className="session-manager">
      <button onClick={createNewSession}>New Session</button>
      <div className="sessions-list">
        {sessions.map((s) => (
          <div key={s.id} className="session-item">
            <h4>{s.id}</h4>
            <p>Progress: {s.reviewedCount}/{s.productCount}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SessionManager

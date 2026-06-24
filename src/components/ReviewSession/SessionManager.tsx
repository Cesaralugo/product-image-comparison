// src/components/ReviewSession/SessionManager.tsx
import React, { useState, useEffect } from 'react'
import { CSVImport } from '@/components/Common'
import { ImageSelector } from '@/components/Gallery'
import { FolderSelector } from '@/components/Common'
import Button from '@/components/Common/Button'
import SessionProgress from './SessionProgress'
import { useFileSystem } from '@/hooks/useFileSystem'
import { useReviewSession } from '@/hooks/useReviewSession'
import { createReviewSession, getAllSessions } from '@/services/api'
import type { ReviewSession } from '@/types'
import './SessionManager.css'

interface SessionManagerProps {
  session?: ReviewSession
  onSessionChange?: (session: ReviewSession) => void
}

const SessionManager: React.FC<SessionManagerProps> = ({
  session: externalSession,
  onSessionChange,
}) => {
  const [sessions, setSessions] = useState<ReviewSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    externalSession?.id || null
  )

  const { pickSaveFile, writeFile } = useFileSystem()
  // Remove isLoading state
  const { session: loadedSession, loading, error } = useReviewSession(
    selectedSessionId || ''
  )

  // Load all sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const result = await getAllSessions()
        setSessions(result)
      } catch (err) {
        console.error('Failed to load sessions:', err)
      }
    }
    loadSessions()
  }, [])

  // Update external session when loaded session changes
  useEffect(() => {
    if (loadedSession && onSessionChange) {
      onSessionChange(loadedSession)
    }
  }, [loadedSession, onSessionChange])

  const handleImportCSV = async (data: Record<string, string>[]) => {
    console.log('Imported CSV data:', data)
    const products = data.map(row => ({
      id: row.id || `product-${Date.now()}-${Math.random()}`,
      reference: row.reference || '',
      description: row.description || '',
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      status: row.status || 'pending'
    }))

    console.log('Products to load:', products)

    // Create a new session with the imported products
    try {
      const newSession = await createReviewSession(products.length)
      setSessions(prev => [newSession, ...prev])
      setSelectedSessionId(newSession.id)
      alert(`Successfully imported ${products.length} products!`)
    } catch (err) {
      console.error('Failed to create session:', err)
      alert('Failed to create session. Please try again.')
    }
  }

  const handleImagesSelected = (paths: string[]) => {
    console.log('Selected images:', paths)
    alert(`Selected ${paths.length} images`)
  }

  const handleFolderSelected = (path: string) => {
    console.log('Selected folder:', path)
    alert(`Selected folder: ${path}`)
  }

  const handleExportReport = async () => {
    const savePath = await pickSaveFile('report.csv', [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ])

    if (savePath) {
      const reportData = `Product,Status,Decision\nProduct1,Approved,Yes\nProduct2,Rejected,No`
      await writeFile(savePath, reportData)
      console.log('Report saved to:', savePath)
      alert(`Report saved to: ${savePath}`)
    }
  }

  const handleCreateNewSession = async () => {
    try {
      const newSession = await createReviewSession(0)
      setSessions(prev => [newSession, ...prev])
      setSelectedSessionId(newSession.id)
      alert('New session created!')
    } catch (err) {
      console.error('Failed to create session:', err)
      alert('Failed to create session. Please try again.')
    }
  }

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId)
  }

  const handleDeleteSession = async (sessionId: string) => {
    // TODO: Implement session deletion
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null)
    }
  }

  return (
    <div className="session-manager">
      <div className="session-header">
        <h2>Session Manager</h2>
        <Button onClick={handleCreateNewSession} variant="primary">
          + New Session
        </Button>
      </div>

      {error && (
        <div className="session-error">
          <span>❌</span> {error}
        </div>
      )}

      {loading && (
        <div className="session-loading">Loading session...</div>
      )}

      {loadedSession && (
        <div className="session-details">
          <h3>Current Session: {loadedSession.id}</h3>
          <p>Status: {loadedSession.status}</p>
          <p>Progress: {loadedSession.reviewedCount}/{loadedSession.productCount} products</p>
          <SessionProgress
            current={loadedSession.reviewedCount}
            total={loadedSession.productCount}
          />
        </div>
      )}

      <div className="session-grid">
        <div className="session-card">
          <h3>📥 Import Products</h3>
          <p className="card-description">
            Import product data from CSV file
          </p>
          <CSVImport
            onImport={handleImportCSV}
            label="Choose CSV File"
            accept="csv"
          />
        </div>

        <div className="session-card">
          <h3>🖼️ Add Images</h3>
          <p className="card-description">
            Select images from your file system
          </p>
          <ImageSelector
            onImagesSelected={handleImagesSelected}
            multiple={true}
          />
        </div>

        <div className="session-card">
          <h3>📁 Image Folder</h3>
          <p className="card-description">
            Select folder containing product images
          </p>
          <FolderSelector
            onFolderSelected={handleFolderSelected}
            label="Choose Folder"
          />
        </div>

        <div className="session-card">
          <h3>📊 Export Report</h3>
          <p className="card-description">
            Generate and export review report
          </p>
          <Button
            onClick={handleExportReport}
            variant="secondary"
          >
            Export Report
          </Button>
        </div>
      </div>

      <div className="sessions-list">
        <h3>All Sessions ({sessions.length})</h3>
        {sessions.length === 0 ? (
          <p className="no-sessions">No sessions yet. Create one above!</p>
        ) : (
          sessions.map((s: ReviewSession) => (
            <div
              key={s.id}
              className={`session-item ${selectedSessionId === s.id ? 'active' : ''}`}
              onClick={() => handleSelectSession(s.id)}
            >
              <div className="session-info">
                <h4>{s.id}</h4>
                <p>Progress: {s.reviewedCount}/{s.productCount} products</p>
                <small>Started: {new Date(s.startedAt).toLocaleString()}</small>
                <span className={`session-status ${s.status}`}>{s.status}</span>
              </div>
              <div className="session-actions">
                <SessionProgress
                  current={s.reviewedCount}
                  total={s.productCount}
                />
                <Button
                  variant="danger"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteSession(s.id)
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SessionManager

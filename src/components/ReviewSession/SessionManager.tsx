// src/components/ReviewSession/SessionManager.tsx
import React, { useState } from 'react'
import { CSVImport } from '@/components/Common'
import { ImageSelector } from '@/components/Gallery'
import { FolderSelector } from '@/components/Common'
import Button from '@/components/Common/Button'
import SessionProgress from './SessionProgress'
import { useFileSystem } from '@/hooks/useFileSystem'
import type { ReviewSession } from '@/types'
import './SessionManager.css'

interface SessionManagerProps {
  session?: ReviewSession
  onSessionChange?: (session: ReviewSession) => void
}

const SessionManager: React.FC<SessionManagerProps> = ({
  session: _session,
  onSessionChange,
}) => {
  const [sessions, setSessions] = useState<ReviewSession[]>([])
  const { pickSaveFile, writeFile } = useFileSystem()

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
    alert(`Successfully imported ${products.length} products!`)
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

  const createNewSession = async () => {
    const newSession: ReviewSession = {
      id: `session-${Date.now()}`,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      productCount: 0,
      reviewedCount: 0,
      reviews: [],
      status: 'in-progress',
    }

    if (onSessionChange) {
      onSessionChange(newSession)
    }

    setSessions(prev => [newSession, ...prev])
  }

  return (
    <div className="session-manager">
      <div className="session-header">
        <h2>Session Manager</h2>
        <Button onClick={createNewSession} variant="primary">
          + New Session
        </Button>
      </div>

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
        <h3>Recent Sessions</h3>
        {sessions.length === 0 ? (
          <p className="no-sessions">No sessions yet. Create one above!</p>
        ) : (
          sessions.map((s: ReviewSession) => (
            <div key={s.id} className="session-item">
              <div className="session-info">
                <h4>{s.id}</h4>
                <p>Progress: {s.reviewedCount}/{s.productCount} products</p>
                <small>Started: {new Date(s.startedAt).toLocaleString()}</small>
              </div>
              <SessionProgress
                current={s.reviewedCount}
                total={s.productCount}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SessionManager

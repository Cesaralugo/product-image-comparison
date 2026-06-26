// src/components/ReviewSession/SessionManager.tsx
import React, { useState, useEffect } from 'react'
import { CSVImport } from '@/components/Common'
import { ImageSelector } from '@/components/Gallery'
import { FolderSelector } from '@/components/Common'
import Button from '@/components/Common/Button'
import SessionProgress from './SessionProgress'
import { useFileSystem } from '@/hooks/useFileSystem'
import { useAppStore } from '@/state/store'
import { createReviewSession, getAllSessions } from '@/services/api'
import type { ReviewSession, Product } from '@/types'
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
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const { navigateTo, deleteSession, loadProducts, products } = useAppStore()
  const { pickSaveFile, writeFile } = useFileSystem()

  // Load all sessions on mount
  useEffect(() => {
    const loadAllSessions = async () => {
      try {
        const result = await getAllSessions()
        console.log('📋 Sessions loaded:', result)
        setSessions(result)
      } catch (err) {
        console.error('Failed to load sessions:', err)
        setNotification({ type: 'error', message: 'Failed to load sessions' })
      }
    }
    loadAllSessions()
  }, [])

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleImportResult = (result: { products: Product[]; count: number; session?: ReviewSession }) => {
    console.log('📦 Import result:', result)

    // Load products into the store
    if (result.products && result.products.length > 0) {
      loadProducts(result.products)
      console.log('✅ Products loaded into store:', result.products)
    }

    if (result.session) {
      console.log('✅ Session from backend:', result.session)
      const session = result.session
      const { startSession } = useAppStore.getState()

      setSessions(prev => {
        const exists = prev.some(s => s.id === session.id)
        if (exists) {
          return prev.map(s => s.id === session.id ? session : s)
        }
        return [session, ...prev]
      })

      setSelectedSessionId(session.id)
      startSession(session)

      setNotification({
        type: 'success',
        message: `✅ Successfully imported ${result.count} products into session ${session.id.substring(0, 8)}...`
      })
    } else {
      // If no session returned, create one
      const createAndAddSession = async () => {
        try {
          const newSession = await createReviewSession(result.count)
          console.log('✅ New session created:', newSession)

          if (result.products && result.products.length > 0) {
            const productRefs = result.products.map(p => p.reference || p.id)
            newSession.productReferences = productRefs
          }

          setSessions(prev => [newSession, ...prev])
          setSelectedSessionId(newSession.id)
          const { startSession } = useAppStore.getState()
          startSession(newSession)

          setNotification({
            type: 'success',
            message: `✅ Successfully imported ${result.count} products into session ${newSession.id.substring(0, 8)}...`
          })

          if (onSessionChange) {
            onSessionChange(newSession)
          }
        } catch (err) {
          console.error('❌ Failed to create session:', err)
          setNotification({
            type: 'error',
            message: '❌ Failed to create session after import.'
          })
        }
      }

      createAndAddSession()
    }
  }

  const handleImagesSelected = (paths: string[]) => {
    console.log('🖼️ Selected images:', paths)
    setNotification({ type: 'success', message: `✅ Selected ${paths.length} images` })
  }

  const handleFolderSelected = (path: string) => {
    console.log('📁 Selected folder:', path)
    setNotification({ type: 'success', message: `✅ Selected folder: ${path}` })
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
      console.log('📄 Report saved to:', savePath)
      setNotification({ type: 'success', message: `✅ Report saved to: ${savePath}` })
    }
  }

  const handleCreateNewSession = async () => {
    try {
      const newSession = await createReviewSession(0)
      console.log('✅ New empty session created:', newSession)
      setSessions(prev => [newSession, ...prev])
      setSelectedSessionId(newSession.id)
      const { startSession } = useAppStore.getState()
      startSession(newSession)
      setNotification({ type: 'success', message: '✅ New session created successfully!' })
    } catch (err) {
      console.error('❌ Failed to create session:', err)
      setNotification({ type: 'error', message: 'Failed to create session. Please try again.' })
    }
  }

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      const { startSession } = useAppStore.getState()
      startSession(session)
      if (onSessionChange) {
        onSessionChange(session)
      }
    }
  }

  const handleViewGallery = (productReference: string) => {
    console.log('🖼️ Viewing gallery for:', productReference)
    navigateTo('gallery')
  }

  const handleDeleteSession = async (sessionId: string) => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to delete this session?\n\n' +
      'This action cannot be undone and will permanently remove:\n' +
      '• All reviews in this session\n' +
      '• Session progress data\n\n' +
      'Are you sure you want to continue?'
    )

    if (!confirmed) return

    setIsDeleting(sessionId)
    setNotification(null)

    console.log('🗑️ Deleting session:', sessionId)
    try {
      await deleteSession(sessionId)

      const result = await getAllSessions()
      setSessions(result)

      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null)
      }

      setNotification({
        type: 'success',
        message: `✅ Session "${sessionId.substring(0, 8)}..." deleted successfully!`
      })
    } catch (error) {
      console.error('❌ Failed to delete session:', error)
      setNotification({
        type: 'error',
        message: '❌ Failed to delete session. Please try again.'
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const toggleExpand = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid Date'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      return date.toLocaleString()
    } catch {
      return 'Invalid Date'
    }
  }

  // Get product details for a session
  const getProductDetails = (session: ReviewSession) => {
    if (!session.productReferences || session.productReferences.length === 0) {
      return []
    }
    // Try to get products from the store
    const sessionProducts = products.filter(p =>
      session.productReferences?.includes(p.reference)
    )
    return sessionProducts
  }

  return (
    <div className="session-manager">
      <div className="session-header">
        <h2>📋 Session Manager</h2>
        <Button onClick={handleCreateNewSession} variant="primary">
          + New Session
        </Button>
      </div>

      {notification && (
        <div className={`notification-banner ${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="notification-message">{notification.message}</span>
          <button
            className="notification-close"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="session-grid">
        <div className="session-card">
          <h3>📥 Import Products</h3>
          <p className="card-description">
            Import product data from CSV file
          </p>
          <CSVImport
            onImportResult={handleImportResult}
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
          <div className="no-sessions">
            <p>📭 No sessions yet. Create one above!</p>
            <p className="no-sessions-hint">
              Import products from CSV or create an empty session to get started.
            </p>
          </div>
        ) : (
          sessions.map((s: ReviewSession) => {
            const sessionProducts = getProductDetails(s)
            const isExpanded = expandedSession === s.id

            return (
              <div
                key={s.id}
                className={`session-item ${selectedSessionId === s.id ? 'active' : ''} ${isDeleting === s.id ? 'deleting' : ''}`}
                onClick={() => handleSelectSession(s.id)}
              >
                <div className="session-info">
                  <div className="session-header-row">
                    <h4>📋 {s.id.substring(0, 12)}...</h4>
                    <span className={`session-status ${s.status || 'active'}`}>
                      {s.status || 'active'}
                    </span>
                  </div>
                  <p>📦 Products: {s.productCount || 0} | ✅ Reviewed: {s.reviewedCount || 0}</p>
                  <small>🕐 Started: {formatDate(s.startedAt)}</small>

                  {/* Session preview with product info */}
                  <div className="session-preview">
                    <div
                      className="session-preview-toggle"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpand(s.id)
                      }}
                    >
                      <span>{isExpanded ? '▼' : '▶'} {isExpanded ? 'Hide' : 'Show'} Product Details</span>
                    </div>

                    {isExpanded && sessionProducts.length > 0 && (
                      <div className="session-products-preview">
                        <div className="products-table">
                          <div className="table-header">
                            <span className="col-reference">Reference</span>
                            <span className="col-description">Description</span>
                            <span className="col-status">Status</span>
                            <span className="col-actions">Actions</span>
                          </div>
                          {sessionProducts.map((product) => (
                            <div key={product.reference} className="table-row">
                              <span className="col-reference">
                                <strong>{product.reference}</strong>
                              </span>
                              <span className="col-description">
                                {product.description || 'No description'}
                              </span>
                              <span className="col-status">
                                <span className={`status-badge ${product.status || 'pending'}`}>
                                  {product.status || 'pending'}
                                </span>
                              </span>
                              <span className="col-actions">
                                <Button
                                  variant="primary"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewGallery(product.reference)
                                  }}
                                >
                                  🖼️ View
                                </Button>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isExpanded && sessionProducts.length === 0 && (
                      <div className="session-products-empty">
                        <p>📭 No product details available</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="session-actions">
                  <SessionProgress
                    current={s.reviewedCount || 0}
                    total={s.productCount || 0}
                  />
                  <Button
                    variant="danger"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSession(s.id)
                    }}
                    disabled={isDeleting === s.id}
                  >
                    {isDeleting === s.id ? '⏳ Deleting...' : '🗑️ Delete'}
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default SessionManager

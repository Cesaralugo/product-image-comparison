// src/components/ReviewSession/SessionManager.tsx
import React, { useState, useEffect } from 'react'
import { CSVImport } from '@/components/Common'
import { ImageSelector } from '@/components/Gallery'
import { FolderSelector } from '@/components/Common'
import Button from '@/components/Common/Button'
import SessionProgress from './SessionProgress'
import { useFileSystem } from '@/hooks/useFileSystem'
import { useAppStore } from '@/state/store'
import { createReviewSession, getAllSessions, getProductsByReference } from '@/services/api'
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
  const [expandedProductMetadata, setExpandedProductMetadata] = useState<string | null>(null)
  const [sessionProducts, setSessionProducts] = useState<Record<string, Product[]>>({})
  const { navigateTo, deleteSession, loadProducts } = useAppStore()
  const { pickSaveFile, writeFile } = useFileSystem()

  // Load all sessions on mount
  useEffect(() => {
    const loadAllSessions = async () => {
      try {
        const result = await getAllSessions()
        console.log('📋 Sessions loaded:', result)
        setSessions(result)

        // Load products for all sessions
        for (const session of result) {
          if (session.productReferences && session.productReferences.length > 0) {
            try {
              const products = await getProductsByReference(session.productReferences)
              setSessionProducts(prev => ({
                ...prev,
                [session.id]: products
              }))
              console.log(`✅ Loaded ${products.length} products for session ${session.id}`)
            } catch (err) {
              console.error(`Failed to load products for session ${session.id}:`, err)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load sessions:', err)
        setNotification({ type: 'error', message: 'Failed to load sessions' })
      }
    }
    loadAllSessions()
  }, [])

  // Load products for the selected session when it changes
  useEffect(() => {
    const loadSessionProducts = async () => {
      if (selectedSessionId) {
        const session = sessions.find(s => s.id === selectedSessionId)
        if (session?.productReferences && session.productReferences.length > 0) {
          if (!sessionProducts[selectedSessionId]) {
            try {
              const products = await getProductsByReference(session.productReferences)
              setSessionProducts(prev => ({
                ...prev,
                [selectedSessionId]: products
              }))
              loadProducts(products)
              console.log(`✅ Loaded ${products.length} products for session ${selectedSessionId}`)
            } catch (err) {
              console.error(`Failed to load products for session ${selectedSessionId}:`, err)
            }
          } else {
            loadProducts(sessionProducts[selectedSessionId])
          }
        }
      }
    }
    loadSessionProducts()
  }, [selectedSessionId, sessions, sessionProducts, loadProducts])

  // Load products when a session is expanded
  const loadProductsForSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session?.productReferences || session.productReferences.length === 0) {
      console.log('⚠️ No product references found for session:', sessionId)
      return
    }

    if (sessionProducts[sessionId]) {
      console.log('📦 Products already cached for session:', sessionId)
      console.log('📦 Cached products with metadata:', sessionProducts[sessionId])
      return
    }

    try {
      console.log(`📦 Loading products for expanded session: ${sessionId}`)
      const products = await getProductsByReference(session.productReferences)
      console.log(`✅ Loaded ${products.length} products with metadata:`, products)
      products.forEach(p => {
        console.log(`📦 ${p.reference} metadata:`, p.metadata)
      })
      setSessionProducts(prev => ({
        ...prev,
        [sessionId]: products
      }))
      loadProducts(products)
    } catch (err) {
      console.error('Failed to load products for expanded session:', err)
    }
  }

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const toggleProductMetadata = (productReference: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedProductMetadata(expandedProductMetadata === productReference ? null : productReference)
  }

  const handleImportResult = (result: { products: Product[]; count: number; session?: ReviewSession }) => {
    console.log('📦 Import result:', result)

    if (result.products && result.products.length > 0) {
      loadProducts(result.products)
      console.log('✅ Products loaded into store:', result.products)
    }

    if (result.session) {
      console.log('✅ Session from backend:', result.session)
      const newSession = result.session
      const { startSession } = useAppStore.getState()

      setSessions(prev => {
        const exists = prev.some(s => s.id === newSession.id)
        if (exists) {
          return prev.map(s => s.id === newSession.id ? newSession : s)
        }
        return [newSession, ...prev]
      })

      if (result.products) {
        setSessionProducts(prev => ({
          ...prev,
          [newSession.id]: result.products
        }))
        loadProducts(result.products)
      }

      setSelectedSessionId(newSession.id)
      startSession(newSession)

      setNotification({
        type: 'success',
        message: `✅ Successfully imported ${result.count} products into session ${newSession.id.substring(0, 8)}...`
      })

      if (onSessionChange) {
        onSessionChange(newSession)
      }
    } else {
      const createAndAddSession = async () => {
        try {
          const newSession = await createReviewSession(result.count)
          console.log('✅ New session created:', newSession)

          if (result.products && result.products.length > 0) {
            const productRefs = result.products.map(p => p.reference || p.id)
            newSession.productReferences = productRefs
            setSessionProducts(prev => ({
              ...prev,
              [newSession.id]: result.products
            }))
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

  const handleSelectSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId)
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      const { startSession } = useAppStore.getState()

      if (session.productReferences && session.productReferences.length > 0) {
        if (!sessionProducts[sessionId]) {
          try {
            const products = await getProductsByReference(session.productReferences)
            setSessionProducts(prev => ({
              ...prev,
              [sessionId]: products
            }))
            loadProducts(products)
            console.log(`✅ Loaded products for session ${sessionId}`)
          } catch (err) {
            console.error('Failed to load products:', err)
          }
        } else {
          loadProducts(sessionProducts[sessionId])
        }
      }

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

      setSessionProducts(prev => {
        const newState = { ...prev }
        delete newState[sessionId]
        return newState
      })

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
    const newExpanded = expandedSession === sessionId ? null : sessionId
    setExpandedSession(newExpanded)

    if (newExpanded === sessionId) {
      loadProductsForSession(sessionId)
    }
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

  const getProductDetails = (session: ReviewSession) => {
    console.log('🔍 Getting product details for session:', session.id)
    console.log('📦 Session product references:', session.productReferences)
    console.log('📦 Cached products:', sessionProducts[session.id])

    if (!session.productReferences || session.productReferences.length === 0) {
      console.log('⚠️ No product references found in session')
      return []
    }

    const products = sessionProducts[session.id] || []
    console.log('📦 Found products for session:', products)
    return products
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
            const sessionProductsList = getProductDetails(s)
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

                    {isExpanded && sessionProductsList.length > 0 && (
                      <div className="session-products-preview">
                        <div className="products-table">
                          <div className="table-header">
                            <span className="col-reference">Reference</span>
                            <span className="col-description">Description</span>
                            <span className="col-status">Status</span>
                            <span className="col-actions">Actions</span>
                          </div>
                          {sessionProductsList.map((product) => (
                            <React.Fragment key={product.reference}>
                              <div className="table-row">
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
                                  {product.metadata && Object.keys(product.metadata).length > 0 && (
                                    <Button
                                      variant="secondary"
                                      size="small"
                                      onClick={(e) => toggleProductMetadata(product.reference, e)}
                                    >
                                      {expandedProductMetadata === product.reference ? '📖 Hide Metadata' : '📖 Show Metadata'}
                                    </Button>
                                  )}
                                </span>
                              </div>
                              {expandedProductMetadata === product.reference && product.metadata && (
                                <div className="table-row-metadata">
                                  <div className="metadata-fields">
                                    {Object.entries(product.metadata).map(([key, value]) => (
                                      <div key={key} className="metadata-field">
                                        <span className="metadata-key">{key}:</span>
                                        <span className="metadata-value">
                                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}

                    {isExpanded && sessionProductsList.length === 0 && (
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

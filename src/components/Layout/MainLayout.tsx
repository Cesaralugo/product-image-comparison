// src/components/Layout/MainLayout.tsx
import React, { useEffect, useState, useRef } from 'react'
import { useAppStore } from '@/state/store'
import { saveReview } from '@/services/api'
import Header from './Header'
import Sidebar from './Sidebar'
import SessionManager from '@/components/ReviewSession/SessionManager'
import SettingsPanel from '@/components/Settings/SettingsPanel'
import ReportGenerator from '@/components/Reports/ReportGenerator'
import GalleryView from '@/components/Gallery/GalleryView'
import type { ReviewSession } from '@/types'
import type { ReviewResult } from '@/types/review'
import './MainLayout.css'

interface MainLayoutProps {
  children?: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  console.log('MainLayout: Rendering...')

  const {
    currentPage,
    navigateTo,
    currentSession,
    loadSessions,
    products
  } = useAppStore()

  // State for gallery
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [reviewMessage, setReviewMessage] = useState<string | null>(null)
  // const [images, setImages] = useState<string[]>([]) // Remove this - images come from GalleryView via callback

  // Use ref to track if initial selection has been made
  const hasSelectedInitial = useRef(false)
  // Store images from gallery
  const [galleryImages, setGalleryImages] = useState<string[]>([])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Update selected product when session changes
  useEffect(() => {
    if (currentSession?.productReferences && currentSession.productReferences.length > 0) {
      if (!hasSelectedInitial.current || !currentSession.productReferences.includes(selectedProduct)) {
        setSelectedProduct(currentSession.productReferences[0])
        hasSelectedInitial.current = true
      }
    }
  }, [currentSession, selectedProduct])

  useEffect(() => {
    console.log('📦 Products in store updated:', products)
  }, [products])

  // Update getProductDetails:
  const getProductDetails = (reference: string) => {
    console.log('🔍 Looking for product:', reference)
    console.log('📦 Available products:', products)
    const found = products.find(p => p.reference === reference)
    console.log('📦 Found product:', found)
    return found
  }

  // Handle saving a review
  const handleSaveReview = async (decision: 'approved' | 'rejected') => {
    if (!currentSession || !selectedProduct) {
      setReviewMessage('❌ No session or product selected')
      return
    }

    setIsSaving(true)
    setReviewMessage(null)

    try {
      // Get product details from the store
      const productDetails = getProductDetails(selectedProduct)
      console.log('📦 Product details for review:', productDetails)

      // Build the review with complete product information
      const review: ReviewResult = {
        id: `review-${Date.now()}`,
        session_id: currentSession.id,
        product_reference: selectedProduct,
        product_description: productDetails?.description || '',
        product_metadata: productDetails?.metadata || {},
        candidates_presented: galleryImages, // Use galleryImages from GalleryView
        selected_images: selectedImages,
        uploaded_replacements: [],
        reviewer_notes: reviewNotes,
        decision_timestamp: new Date().toISOString(),
        time_to_decide: 0,
        status: decision
      }

      console.log('📝 Saving review with description:', review.product_description)
      console.log('📝 Full review:', review)
      await saveReview(review)
      setReviewMessage(`✅ Review saved successfully! Product ${selectedProduct} ${decision}`)
      setReviewNotes('')
      setSelectedImages([])

      await loadSessions()
    } catch (err) {
      console.error('Failed to save review:', err)
      setReviewMessage('❌ Failed to save review. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle image selection from gallery
  const handleImageSelect = (path: string) => {
    console.log('🖼️ Image selected:', path)
    setSelectedImages(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    )
  }

  // Handle images loaded from gallery
  const handleImagesLoaded = (paths: string[]) => {
    console.log('🖼️ Images loaded:', paths)
    setGalleryImages(paths)
  }

  const renderContent = () => {
    console.log('Rendering page:', currentPage)

    switch (currentPage) {
      case 'dashboard': {
        const { sessions } = useAppStore.getState()

        const activeSessions = sessions.filter(s => s.status === 'active' || s.status === 'in-progress').length
        const totalReviewed = sessions.reduce((sum, s) => sum + (s.reviewedCount || 0), 0)
        const totalProducts = sessions.reduce((sum, s) => sum + (s.productCount || 0), 0)
        const completionRate = totalProducts > 0 ? Math.round((totalReviewed / totalProducts) * 100) : 0

        return (
          <div className="page-content">
            <h2>📊 Dashboard</h2>
            <p>Welcome to the Product Image Review Platform!</p>
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>📋 Active Sessions</h3>
                <p className="stat-number">{activeSessions}</p>
                <small>Total sessions: {sessions.length}</small>
              </div>
              <div className="stat-card">
                <h3>✅ Reviewed Products</h3>
                <p className="stat-number">{totalReviewed}</p>
                <small>Out of {totalProducts} total products</small>
              </div>
              <div className="stat-card">
                <h3>📦 Total Products</h3>
                <p className="stat-number">{totalProducts}</p>
                <small>Across all sessions</small>
              </div>
              <div className="stat-card">
                <h3>📈 Completion Rate</h3>
                <p className="stat-number">{completionRate}%</p>
                <small>{totalReviewed}/{totalProducts} products reviewed</small>
              </div>
            </div>

            {sessions.length > 0 && (
              <div className="recent-activity">
                <h3>Recent Sessions</h3>
                <ul>
                  {sessions.slice(0, 3).map(s => (
                    <li key={s.id}>
                      <span>📋 {s.id.substring(0, 12)}...</span>
                      <span>{s.reviewedCount || 0}/{s.productCount || 0} reviewed</span>
                      <span className={`status-badge ${s.status || 'active'}`}>
                        {s.status || 'active'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      }

      case 'sessions':
        return (
          <div className="page-content">
            <SessionManager
              session={currentSession || undefined}
              onSessionChange={(session: ReviewSession) => {
                console.log('Session changed:', session)
              }}
            />
          </div>
        )

      case 'gallery': {
        const productRefs = currentSession?.productReferences || []
        // ✅ Only set currentProduct if there are product references
        const currentProduct = (productRefs.length > 0 && selectedProduct && productRefs.includes(selectedProduct))
          ? selectedProduct
          : productRefs[0] || ''

        const productDetails = currentProduct ? getProductDetails(currentProduct) : null

        // Use session ID and product as key to force re-render
        const galleryKey = `${currentSession?.id || 'no-session'}-${currentProduct || 'no-product'}`

        return (
          <div className="page-content">
            <h2>🖼️ Gallery</h2>

            {/* Session info */}
            {currentSession && (
              <div className="session-info-banner">
                <span>📋 Session: {currentSession.id.substring(0, 12)}...</span>
                <span>📦 Products: {currentSession.productCount || 0}</span>
                <span>✅ Reviewed: {currentSession.reviewedCount || 0}</span>
              </div>
            )}

            {/* Product selector - only show if there are products */}
            {productRefs.length > 0 ? (
              <div className="gallery-controls">
                <label htmlFor="product-select">Select Product:</label>
                <select
                  id="product-select"
                  value={currentProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value)
                    setSelectedImages([])
                    setReviewNotes('')
                  }}
                  className="product-select"
                >
                  {productRefs.map(ref => (
                    <option key={ref} value={ref}>{ref}</option>
                  ))}
                </select>
                <span className="product-count">{productRefs.length} products</span>
              </div>
            ) : (
              <div className="gallery-controls empty">
                <span className="empty-message">📭 No products in this session</span>
              </div>
            )}

            {/* Product Metadata - only show if we have a product */}
            {productDetails && currentProduct && (
              <div className="product-metadata">
                <h3>📋 Product Details</h3>
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <label>Reference:</label>
                    <span><strong>{productDetails.reference}</strong></span>
                  </div>
                  <div className="metadata-item">
                    <label>Description:</label>
                    <span>{productDetails.description || 'No description'}</span>
                  </div>
                  {productDetails.metadata && (
                    <div className="metadata-item full-width">
                      <label>Metadata:</label>
                      <pre>{JSON.stringify(productDetails.metadata, null, 2)}</pre>
                    </div>
                  )}
                  <div className="metadata-item">
                    <label>Status:</label>
                    <span className={`status-badge ${productDetails.status || 'pending'}`}>
                      {productDetails.status || 'pending'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Gallery View - only show if we have a product */}
            {currentProduct ? (
              <GalleryView
                key={galleryKey}
                productReference={currentProduct}
                onImageSelect={handleImageSelect}
                onImagesLoaded={handleImagesLoaded}
              />
            ) : (
              <div className="gallery-empty">
                <p>📷 No product selected</p>
                <p className="gallery-hint">
                  {productRefs.length === 0
                    ? 'This session has no products. Import products from CSV first.'
                    : 'Please select a product from the dropdown above'
                  }
                </p>
              </div>
            )}

            {/* Review Controls - only show if we have a product */}
            {currentProduct && (
              <div className="review-controls">
                <h3>📝 Review Product: {currentProduct}</h3>

                {reviewMessage && (
                  <div className={`review-message ${reviewMessage.startsWith('✅') ? 'success' : 'error'}`}>
                    {reviewMessage}
                  </div>
                )}

                <div className="review-notes">
                  <label>Review Notes:</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter your review notes here..."
                    rows={3}
                    disabled={isSaving}
                  />
                </div>

                {selectedImages.length > 0 && (
                  <div className="selected-images-preview">
                    <label>Selected Images ({selectedImages.length}):</label>
                    <div className="selected-thumbnails">
                      {selectedImages.map((path, i) => (
                        <img key={i} src={path} alt={`Selected ${i+1}`} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="review-actions">
                  <button
                    className="btn-approve"
                    onClick={() => handleSaveReview('approved')}
                    disabled={isSaving}
                  >
                    {isSaving ? '⏳ Saving...' : '✅ Approve'}
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleSaveReview('rejected')}
                    disabled={isSaving}
                  >
                    {isSaving ? '⏳ Saving...' : '❌ Reject'}
                  </button>
                  <button
                    className="btn-skip"
                    onClick={() => {
                      setReviewNotes('')
                      setSelectedImages([])
                      setReviewMessage(null)
                    }}
                    disabled={isSaving}
                  >
                    ⏭️ Skip
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      }

      case 'reports':
        return (
          <div className="page-content">
            <ReportGenerator
              sessionId={currentSession?.id || ''}
              onGenerateReport={(format, path) => {
                console.log('Report generated:', format, path)
              }}
              showPreview={true}
            />
          </div>
        )

      case 'settings':
        return (
          <div className="page-content">
            <SettingsPanel
              onSave={(settings) => {
                console.log('Settings saved:', settings)
              }}
            />
          </div>
        )

      default:
        return children || <div>Page not found</div>
    }
  }

  return (
    <div className="main-layout">
      <Header />
      <div className="layout-body">
        <Sidebar
          onNavigate={navigateTo}
          activePage={currentPage}
        />
        <main className="layout-content">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default MainLayout

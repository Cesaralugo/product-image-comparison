// src/components/Common/ZipImport.tsx
import React, { useState, useEffect } from 'react'
import { useFileSystem } from '@/hooks/useFileSystem'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import Button from './Button'
import './ZipImport.css'

interface ZipImportProps {
  onImportComplete?: (result: {
    status: string
    message: string
    summary: {
      products_imported: number
      images_cataloged: number
      mappings_applied: number
      warnings: string[]
      image_errors: string[]
      mapping_errors: string[]
      temp_path: string
    }
  }) => void
  onError?: (error: string) => void
}

interface ImportProgress {
  step: string
  status: string
  processed: number
  total: number
  percentage: number
  message: string
}

const ZipImport: React.FC<ZipImportProps> = ({ onImportComplete, onError }) => {
  const { pickFile, isLoading } = useFileSystem()
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [unlisten, setUnlisten] = useState<(() => void) | null>(null)

  useEffect(() => {
    const setupListener = async () => {
      const unlistenFn = await listen('import-progress', (event) => {
        setProgress(event.payload as ImportProgress)
      })
      setUnlisten(() => unlistenFn)
    }
    setupListener()

    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [unlisten]) // ✅ Add unlisten to dependencies

  const handleImport = async () => {
    try {
      setImporting(true)
      setError(null)
      setProgress(null)

      const filePath = await pickFile('zip')
      if (!filePath || typeof filePath !== 'string') {
        setImporting(false)
        return
      }

      const result = await invoke<{
        status: string
        message: string
        summary: {
          products_imported: number
          images_cataloged: number
          mappings_applied: number
          warnings: string[]
          image_errors: string[]
          mapping_errors: string[]
          temp_path: string
        }
      }>('import_product_package', { zipPath: filePath })
      console.log('✅ Import result:', result)

      if (onImportComplete) {
        onImportComplete(result)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to import package'
      setError(msg)
      if (onError) onError(msg)
      console.error('❌ Import error:', err)
    } finally {
      setImporting(false)
    }
  }

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'validating': return '🔍'
      case 'extracting': return '📦'
      case 'importing_products': return '📋'
      case 'cataloging_images': return '🖼️'
      case 'applying_mappings': return '🔗'
      case 'complete': return '✅'
      default: return '⏳'
    }
  }

  return (
    <div className="zip-import">
      <div className="import-header">
        <h3>📦 Import Product Package</h3>
        <p className="import-description">
          Import a ZIP file containing products, images, and image mappings in one go.
        </p>
      </div>

      <div className="import-controls">
        <Button
          onClick={handleImport}
          disabled={isLoading || importing}
          variant="primary"
          size="large"
        >
          {importing ? '⏳ Importing...' : '📤 Choose ZIP File'}
        </Button>
      </div>

      {error && (
        <div className="import-error">
          <span>❌</span> {error}
        </div>
      )}

      {progress && (
        <div className="import-progress">
          <div className="progress-header">
            <span className="progress-icon">{getStepIcon(progress.step)}</span>
            <span className="progress-step">{progress.message}</span>
            <span className="progress-status">{progress.status}</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${progress.percentage || 0}%` }}
            />
          </div>
          <div className="progress-details">
            <span>{progress.processed || 0} / {progress.total || 0}</span>
            <span>{progress.percentage || 0}%</span>
          </div>
        </div>
      )}

      <div className="import-requirements">
        <h4>📋 Package Requirements</h4>
        <ul>
          <li>✅ Must contain <code>products.csv</code> with product data</li>
          <li>✅ Must contain <code>images/</code> folder with all images</li>
          <li>✅ Must contain <code>image_mappings.csv</code> linking images to products</li>
        </ul>
      </div>
    </div>
  )
}

export default ZipImport  // ✅ Use default export

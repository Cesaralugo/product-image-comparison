// src/components/Common/CSVImport.tsx
import React, { useState } from 'react'
import { useFileSystem } from '@/hooks/useFileSystem'
import { loadProductsFromCSV } from '@/services/api'
import Button from './Button'
import type { Product, ReviewSession } from '@/types'
import './CSVImport.css'

interface CSVImportProps {
  onImportResult?: (result: { products: Product[]; count: number; session?:ReviewSession }) => void
  onError?: (error: string) => void
  label?: string
  accept?: string
}

const CSVImport: React.FC<CSVImportProps> = ({
  onImportResult,
  onError,
  label = 'Import CSV',
  accept = 'csv'
}) => {
  const { pickFile, isLoading, error } = useFileSystem()
  const [fileName, setFileName] = useState<string>('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ count: number } | null>(null)

  const handleImport = async () => {
    try {
      setImporting(true)
      setImportResult(null)

      const filePath = await pickFile(accept)

      if (!filePath || typeof filePath !== 'string') {
        setImporting(false)
        return
      }

      setFileName(filePath.split('/').pop() || filePath)

      const result = await loadProductsFromCSV(filePath)
      console.log('✅ Import result:', result)

      setImportResult({ count: result.count })

      if (onImportResult) {
        onImportResult({
          products: result.products,  // ✅ Pass products
          count: result.count,
          session: result.session
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to import CSV'
      if (onError) onError(msg)
      console.error('❌ Import error:', err)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="csv-import">
      <div className="import-controls">
        <Button
          onClick={handleImport}
          disabled={isLoading || importing}
          variant="primary"
        >
          {isLoading || importing ? '⏳ Importing...' : label}
        </Button>
        {fileName && <span className="file-name">📄 {fileName}</span>}
      </div>
      {error && <span className="error-text">❌ {error}</span>}
      {importResult && (
        <div className="success-text">
          ✅ Imported {importResult.count} products successfully!
        </div>
      )}
    </div>
  )
}

export default CSVImport

// src/components/Common/CSVImport.tsx
import React, { useState } from 'react'
import { useFileSystem } from '@/hooks/useFileSystem'
import Button from './Button'
import './CSVImport.css'

interface CSVImportProps {
  onImport: (data: Record<string, string>[]) => void
  onError?: (error: string) => void
  label?: string
  accept?: string
}

const CSVImport: React.FC<CSVImportProps> = ({
  onImport,
  onError,
  label = 'Import CSV',
  accept = 'csv'
}) => {
  const { pickFile, readFileAsText, isLoading, error } = useFileSystem()
  const [fileName, setFileName] = useState<string>('')
  const [importing, setImporting] = useState(false)

  const handleImport = async () => {
    try {
      setImporting(true)
      const filePath = await pickFile(accept)

      if (!filePath || typeof filePath !== 'string') {
        return
      }

      setFileName(filePath.split('/').pop() || filePath)
      const content = await readFileAsText(filePath)

      // Parse CSV
      const lines = content.split('\n').filter(line => line.trim())
      if (lines.length < 2) {
        throw new Error('CSV must have at least a header row and one data row')
      }

      const headers = lines[0].split(',').map(h => h.trim())
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const obj: Record<string, string> = {}
        headers.forEach((header, i) => {
          obj[header] = values[i] || ''
        })
        return obj
      })

      onImport(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to import CSV'
      if (onError) onError(msg)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="csv-import">
      <Button
        onClick={handleImport}
        disabled={isLoading || importing}
        variant="primary"
      >
        {isLoading || importing ? 'Importing...' : label}
      </Button>
      {fileName && <span className="file-name">📄 {fileName}</span>}
      {error && <span className="error-text">{error}</span>}
    </div>
  )
}

export default CSVImport

// src/components/Common/FolderSelector.tsx
import React, { useState } from 'react'
import { useFileSystem } from '@/hooks/useFileSystem'
import Button from './Button'
import './FolderSelector.css'

interface FolderSelectorProps {
  onFolderSelected: (folderPath: string) => void
  label?: string
}

const FolderSelector: React.FC<FolderSelectorProps> = ({
  onFolderSelected,
  label = 'Select Folder'
}) => {
  const { pickFolder, isLoading, error } = useFileSystem()
  const [folderPath, setFolderPath] = useState<string>('')

  const handleSelectFolder = async () => {
    try {
      const path = await pickFolder()
      if (path) {
        setFolderPath(path)
        onFolderSelected(path)
      }
    } catch (err) {
      console.error('Failed to select folder:', err)
    }
  }

  return (
    <div className="folder-selector">
      <Button
        onClick={handleSelectFolder}
        disabled={isLoading}
        variant="secondary"
      >
        {isLoading ? 'Loading...' : label}
      </Button>
      {folderPath && (
        <div className="folder-path">
          📁 {folderPath}
        </div>
      )}
      {error && <div className="error-text">{error}</div>}
    </div>
  )
}

export default FolderSelector

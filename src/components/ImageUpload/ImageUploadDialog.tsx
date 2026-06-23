interface ImageUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (files: FileList) => void
}

const ImageUploadDialog: React.FC<ImageUploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  if (!isOpen) return null

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onUpload(e.target.files)
      onClose()
    }
  }

  return (
    <div className="upload-dialog-overlay" onClick={onClose}>
      <div className="upload-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Upload Replacement Image</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          autoFocus
        />
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}

export default ImageUploadDialog

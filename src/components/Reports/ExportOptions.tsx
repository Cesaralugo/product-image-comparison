import './ExportOptions.css'

interface ExportOptionsProps {
  onExportPDF: () => void
  onExportCSV: () => void
  onExportJSON?: () => void
}

const ExportOptions: React.FC<ExportOptionsProps> = ({
  onExportPDF,
  onExportCSV,
  onExportJSON,
}) => {
  return (
    <div className="export-options">
      <h3>Export Options</h3>
      <div className="button-group">
        <button onClick={onExportPDF} className="export-btn pdf">
          📄 Export as PDF
        </button>
        <button onClick={onExportCSV} className="export-btn csv">
          📊 Export as CSV
        </button>
        {onExportJSON && (
          <button onClick={onExportJSON} className="export-btn json">
            {} Export as JSON
          </button>
        )}
      </div>
    </div>
  )
}

export default ExportOptions

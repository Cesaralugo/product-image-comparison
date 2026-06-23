import { useState } from 'react'
import './ExportOptions.css'

interface ReportGeneratorProps {
  sessionId: string
  onGenerateReport: (format: 'pdf' | 'csv', outputPath: string) => void
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  sessionId,
  onGenerateReport,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv'>('pdf')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      // TODO: Open save dialog and generate report
      const outputPath = `report_${sessionId}.${selectedFormat}`
      onGenerateReport(selectedFormat, outputPath)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="report-generator">
      <h2>Generate Report</h2>
      <div className="format-selection">
        <label>
          <input
            type="radio"
            value="pdf"
            checked={selectedFormat === 'pdf'}
            onChange={(e) => setSelectedFormat(e.target.value as 'pdf' | 'csv')}
          />
          PDF Report
        </label>
        <label>
          <input
            type="radio"
            value="csv"
            checked={selectedFormat === 'csv'}
            onChange={(e) => setSelectedFormat(e.target.value as 'pdf' | 'csv')}
          />
          CSV Report
        </label>
      </div>
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Report'}
      </button>
    </div>
  )
}

export default ReportGenerator

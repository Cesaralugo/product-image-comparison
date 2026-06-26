// src/components/Debug/DebugPanel.tsx
import React, { useState } from 'react'
import { settingsService } from '@/services/settingsService'
import { invoke } from '@tauri-apps/api/core'
import type { AppSettings } from '@/types/settings'
import './DebugPanel.css'

const DebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('🔍 [DEBUG] Checking settings...')
      const result = await invoke<Record<string, unknown>>('verify_settings')
      console.log('✅ [DEBUG] Settings check result:', result)
      setDebugInfo(result)
    } catch (err) {
      console.error('❌ [DEBUG] Error checking settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to check settings')
    } finally {
      setLoading(false)
    }
  }

  const testSaveSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('💾 [DEBUG] Testing save...')
      // Use snake_case to match Rust backend
      const testSettings: AppSettings = {
        discovery: {
          default_strategy: 'folder',
          base_path: '/test/path',
          filename_pattern: '{reference}_*.jpg',
          auto_discover_on_load: true,
          max_candidates: 20
        },
        performance: {
          thumbnail_size: 200,
          grid_columns: 3,
          lazy_load_threshold: 10,
          preload_count: 4
        },
        storage: {
          images_path: '/test/images',
          cache_size_mb: 500,
          auto_cleanup_days: 7,
          compression_quality: 80
        },
        review: {
          require_notes: false,
          allow_multiple_selection: true,
          max_uploads_per_product: 5,
          auto_save_progress: true
        }
      }

      await settingsService.updateSettings(testSettings)
      console.log('✅ [DEBUG] Settings saved!')

      // Verify after save
      const result = await invoke<Record<string, unknown>>('verify_settings')
      console.log('✅ [DEBUG] Verification after save:', result)
      setDebugInfo(result)
    } catch (err) {
      console.error('❌ [DEBUG] Error testing save:', err)
      setError(err instanceof Error ? err.message : 'Failed to test save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="debug-panel">
      <h3>🔧 Debug Panel</h3>

      <div className="debug-actions">
        <button onClick={checkSettings} disabled={loading}>
          🔍 Check Settings
        </button>
        <button onClick={testSaveSettings} disabled={loading}>
          💾 Test Save
        </button>
        <button onClick={() => {
          console.clear()
          setDebugInfo(null)
          setError(null)
        }}>
          🗑️ Clear Console
        </button>
      </div>

      {loading && <div className="debug-loading">⏳ Loading...</div>}

      {error && (
        <div className="debug-error">
          ❌ {error}
        </div>
      )}

      {debugInfo && (
        <div className="debug-output">
          <h4>📋 Debug Information</h4>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}

      <div className="debug-hint">
        <p>💡 Check the browser console (F12) for detailed logs</p>
      </div>
    </div>
  )
}

export default DebugPanel

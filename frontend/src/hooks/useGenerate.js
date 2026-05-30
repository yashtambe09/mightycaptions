import { useState } from 'react'

const API = import.meta.env.VITE_API_URL || ''

export function useGenerate() {
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  async function uploadVideo(file, onProgress) {
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()
      return await new Promise((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100))
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            const msg = JSON.parse(xhr.responseText)?.detail || 'Upload failed'
            reject(new Error(msg))
          }
        }
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.open('POST', `${API}/api/upload`)
        xhr.send(formData)
      })
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setUploading(false)
    }
  }

  async function generateCaptions({ jobId, description, tone, languages }) {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, description, tone, languages }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Generation failed')
      }
      return await res.json()
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setGenerating(false)
    }
  }

  return { uploading, generating, error, uploadVideo, generateCaptions }
}

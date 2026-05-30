import { useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import CaptionEditor from '../components/CaptionEditor'

const LANG_LABELS = {
  'en-IN': '🇮🇳 English',
  'hi-EN': '🙏 Hinglish',
  'mr-EN': '🧡 MarathiEnglish',
}

const API = import.meta.env.VITE_API_URL || ''

export default function Result() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const { jobId, captions: initialCaptions, jobInfo, style, selectedLanguages } = state || {}

  const [captions, setCaptions] = useState(initialCaptions || {})
  const [activeTab, setActiveTab] = useState(selectedLanguages?.[0] || 'en-IN')
  const [previewLang, setPreviewLang] = useState(selectedLanguages?.[0] || 'en-IN')
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(null)
  const [downloadProgress, setDownloadProgress] = useState('')
  const videoRef = useRef()

  function updateCaptions(lang, updated) {
    setCaptions((prev) => ({ ...prev, [lang]: updated }))
  }

  async function handleDownload() {
    setDownloading(true)
    setDownloadError(null)
    setDownloadProgress('Burning captions… ~30 seconds')
    try {
      const res = await fetch(`${API}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          language: previewLang,
          captions: captions[previewLang] || [],
          style,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Processing failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mightycaptions_output.mp4'
      a.click()
      URL.revokeObjectURL(url)
      setDownloadProgress('Done! Check your downloads.')
    } catch (e) {
      setDownloadError(e.message)
      setDownloadProgress('')
    } finally {
      setDownloading(false)
    }
  }

  if (!state) {
    navigate('/')
    return null
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-secondary hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3 ml-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-bold text-sm">M</div>
          <span className="font-bold text-lg">MightyCaptions</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left — Video Preview */}
          <div className="flex flex-col items-center gap-4 lg:w-64 flex-shrink-0">
            <div
              className="relative rounded-2xl overflow-hidden bg-black border border-border w-full"
              style={{ aspectRatio: '9/16' }}
            >
              {jobInfo?.thumbnail ? (
                <img
                  src={`data:image/jpeg;base64,${jobInfo.thumbnail}`}
                  alt="Video"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🎬</div>
              )}
              {/* Caption overlay preview */}
              {captions[previewLang]?.[0] && (
                <div className="absolute bottom-6 left-0 right-0 text-center px-3">
                  <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded">
                    {captions[previewLang][0].text}
                  </span>
                </div>
              )}
            </div>

            {/* Language switcher for preview */}
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setPreviewLang(lang)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    previewLang === lang
                      ? 'border-accent bg-accent text-white'
                      : 'border-border text-secondary hover:border-accent/40'
                  }`}
                >
                  {LANG_LABELS[lang]}
                </button>
              ))}
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full bg-accent hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-colors"
            >
              {downloading ? 'Processing...' : 'Download Video ⬇'}
            </button>
            {downloadProgress && (
              <p className="text-secondary text-xs text-center">{downloadProgress}</p>
            )}
            {downloadError && (
              <p className="text-red-400 text-xs text-center">{downloadError}</p>
            )}
          </div>

          {/* Right — Caption Editor */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold mb-4">Edit Captions</h2>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
              {selectedLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveTab(lang)}
                  className={`flex-shrink-0 text-sm px-4 py-2 rounded-lg border transition-all ${
                    activeTab === lang
                      ? 'border-accent bg-accent/10 text-white font-medium'
                      : 'border-border text-secondary hover:border-accent/40'
                  }`}
                >
                  {LANG_LABELS[lang]}
                </button>
              ))}
            </div>

            <CaptionEditor
              captions={captions[activeTab] || []}
              onChange={(updated) => updateCaptions(activeTab, updated)}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

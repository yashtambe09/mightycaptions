import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import VideoUpload from '../components/VideoUpload'
import VideoPreview from '../components/VideoPreview'
import TonePicker from '../components/TonePicker'
import LanguageToggle from '../components/LanguageToggle'
import StylePicker from '../components/StylePicker'
import { useGenerate } from '../hooks/useGenerate'

export default function Home() {
  const navigate = useNavigate()
  const { uploading, generating, error, uploadVideo, generateCaptions } = useGenerate()

  const [uploadProgress, setUploadProgress] = useState(0)
  const [jobInfo, setJobInfo] = useState(null) // { jobId, duration, thumbnail }
  const [description, setDescription] = useState('')
  const [tone, setTone] = useState('relatable')
  const [languages, setLanguages] = useState(['en-IN', 'hi-EN', 'mr-EN'])
  const [style, setStyle] = useState('clean_white')

  async function handleUpload(file) {
    setUploadProgress(0)
    try {
      const data = await uploadVideo(file, setUploadProgress)
      setJobInfo(data)
    } catch (_) {}
  }

  async function handleGenerate() {
    if (!jobInfo) return
    try {
      const data = await generateCaptions({
        jobId: jobInfo.jobId,
        description,
        tone,
        languages,
      })
      navigate('/result', { state: { ...data, jobInfo, style, selectedLanguages: languages } })
    } catch (_) {}
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-bold text-sm">M</div>
        <div>
          <span className="font-bold text-lg">MightyCaptions</span>
          <span className="text-secondary text-xs ml-2">Your reels, now they speak</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Upload */}
        <section>
          <VideoUpload
            onUpload={handleUpload}
            uploading={uploading}
            uploadProgress={uploadProgress}
          />
        </section>

        {/* After upload: thumbnail + form */}
        {jobInfo && (
          <>
            <section className="flex gap-6 items-start">
              <VideoPreview
                jobId={jobInfo.jobId}
                thumbnail={jobInfo.thumbnail}
                duration={jobInfo.duration}
              />
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-sm font-medium text-secondary uppercase tracking-wider block mb-1">
                    Optional context
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Helps with language adaptation — e.g. skincare routine, cooking video, travel vlog, motivational talk..."
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-secondary outline-none focus:border-accent/60 resize-none transition-colors"
                  />
                </div>
              </div>
            </section>

            <TonePicker selected={tone} onChange={setTone} />
            <LanguageToggle selected={languages} onChange={setLanguages} />
            <StylePicker selected={style} onChange={setStyle} />

            {error && (
              <div className="bg-red-900/30 border border-red-500/40 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating || languages.length === 0}
              className="w-full bg-accent hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg transition-colors"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-3">
                  <Spinner /> Transcribing audio… this may take 20–30 seconds
                </span>
              ) : (
                'Transcribe & Generate ✨'
              )}
            </button>

            {generating && <GeneratingSkeleton />}
          </>
        )}
      </main>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

function GeneratingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 bg-surface rounded-xl border border-border" />
      ))}
      <p className="text-secondary text-sm text-center">Transcribing audio… this may take 20–30 seconds</p>
    </div>
  )
}

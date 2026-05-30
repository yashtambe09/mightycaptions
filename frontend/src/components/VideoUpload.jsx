import { useRef, useState } from 'react'

export default function VideoUpload({ onUpload, uploading, uploadProgress }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)

  function handleFile(file) {
    if (!file) return
    if (!['video/mp4', 'video/quicktime'].includes(file.type)) {
      alert('Please upload an MP4 or MOV file.')
      return
    }
    onUpload(file)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
        dragging ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/60'
      }`}
      onClick={() => !uploading && inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {uploading ? (
        <div className="space-y-4">
          <div className="text-4xl">📤</div>
          <p className="text-white font-medium">Uploading...</p>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-secondary text-sm">{uploadProgress}%</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-5xl">🎬</div>
          <p className="text-white text-lg font-semibold">Drop your reel here</p>
          <p className="text-secondary text-sm">or click to browse · MP4 or MOV · max 500MB</p>
        </div>
      )}
    </div>
  )
}

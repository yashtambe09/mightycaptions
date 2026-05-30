export default function VideoPreview({ jobId, thumbnail, duration }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative rounded-2xl overflow-hidden bg-black border border-border"
        style={{ width: '100%', maxWidth: 200, aspectRatio: '9/16' }}
      >
        {thumbnail ? (
          <img
            src={`data:image/jpeg;base64,${thumbnail}`}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🎬</div>
        )}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
          {formatDuration(duration)}
        </div>
      </div>
    </div>
  )
}

function formatDuration(secs) {
  if (!secs) return ''
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

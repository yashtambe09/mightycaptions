import { useState } from 'react'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(1).padStart(4, '0')
  return `${m.toString().padStart(2, '0')}:${s}`
}

function parseTime(str) {
  const [m, s] = str.split(':')
  return parseFloat(m) * 60 + parseFloat(s)
}

export default function CaptionEditor({ captions, onChange }) {
  const [editingTime, setEditingTime] = useState(null) // { index, field }

  function updateText(index, text) {
    const updated = captions.map((c, i) => (i === index ? { ...c, text } : c))
    onChange(updated)
  }

  function updateTime(index, field, value) {
    try {
      const seconds = parseTime(value)
      if (isNaN(seconds) || seconds < 0) return
      const updated = captions.map((c, i) => (i === index ? { ...c, [field]: seconds } : c))
      onChange(updated)
    } catch (_) {}
    setEditingTime(null)
  }

  if (!captions || captions.length === 0) {
    return <p className="text-secondary text-sm text-center py-8">No captions for this language.</p>
  }

  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
      {captions.map((cap, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-secondary font-mono">
            <TimeField
              value={formatTime(cap.start)}
              active={editingTime?.index === i && editingTime?.field === 'start'}
              onActivate={() => setEditingTime({ index: i, field: 'start' })}
              onSave={(v) => updateTime(i, 'start', v)}
            />
            <span>→</span>
            <TimeField
              value={formatTime(cap.end)}
              active={editingTime?.index === i && editingTime?.field === 'end'}
              onActivate={() => setEditingTime({ index: i, field: 'end' })}
              onSave={(v) => updateTime(i, 'end', v)}
            />
          </div>
          <input
            type="text"
            value={cap.text}
            onChange={(e) => updateText(i, e.target.value)}
            className="w-full bg-transparent text-white text-sm outline-none border-b border-transparent focus:border-accent/50 transition-colors pb-0.5"
          />
        </div>
      ))}
    </div>
  )
}

function TimeField({ value, active, onActivate, onSave }) {
  const [draft, setDraft] = useState(value)

  if (active) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onSave(draft)}
        onKeyDown={(e) => e.key === 'Enter' && onSave(draft)}
        className="w-16 bg-surface border border-accent rounded px-1 text-accent outline-none"
      />
    )
  }
  return (
    <span
      className="cursor-pointer hover:text-accent transition-colors px-1 rounded hover:bg-accent/10"
      onClick={() => { setDraft(value); onActivate() }}
    >
      {value}
    </span>
  )
}

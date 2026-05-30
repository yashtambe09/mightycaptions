const TONES = [
  { id: 'relatable', emoji: '😄', label: 'Relatable' },
  { id: 'inspirational', emoji: '✨', label: 'Inspirational' },
  { id: 'informative', emoji: '📚', label: 'Informative' },
  { id: 'funny', emoji: '😂', label: 'Funny' },
  { id: 'aesthetic', emoji: '🌸', label: 'Aesthetic' },
]

export default function TonePicker({ selected, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-secondary uppercase tracking-wider">Tone</p>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {TONES.map((tone) => (
          <button
            key={tone.id}
            onClick={() => onChange(tone.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
              selected === tone.id
                ? 'border-accent bg-accent text-white'
                : 'border-border bg-surface text-secondary hover:border-accent/40 hover:text-white'
            }`}
          >
            <span>{tone.emoji}</span>
            <span>{tone.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

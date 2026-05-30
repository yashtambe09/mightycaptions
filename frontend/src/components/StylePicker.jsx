const STYLES = [
  {
    id: 'clean_white',
    name: 'Clean White',
    preview: { font: 'bold 18px sans-serif', color: '#FFFFFF', outline: true, bg: false },
  },
  {
    id: 'instagram_bold',
    name: 'Instagram Bold',
    preview: { font: 'bold 20px sans-serif', color: '#33E0FF', outline: true, bg: false },
  },
  {
    id: 'podcast',
    name: 'Podcast',
    preview: { font: '600 16px sans-serif', color: '#FFFFFF', outline: false, bg: true },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    preview: { font: '400 14px sans-serif', color: '#FFFFFF', outline: false, bg: true, light: true },
  },
  {
    id: 'aesthetic',
    name: 'Aesthetic',
    preview: { font: 'bold 16px serif', color: '#FFFFFF', outline: true, bg: false },
  },
]

function StylePreview({ style }) {
  const p = style.preview
  return (
    <div className="w-full h-16 rounded-lg bg-[#111] flex items-end justify-center pb-2 overflow-hidden relative">
      <div
        className={`px-2 py-0.5 text-xs rounded ${p.bg ? (p.light ? 'bg-black/20' : 'bg-black/50') : ''}`}
        style={{
          fontFamily: p.font.includes('serif') && !p.font.includes('sans') ? 'Georgia, serif' : 'sans-serif',
          fontWeight: p.font.includes('bold') || p.font.includes('600') ? '700' : '400',
          color: p.color,
          textShadow: p.outline ? '0 0 4px #000, 1px 1px 0 #000, -1px -1px 0 #000' : 'none',
        }}
      >
        {style.name === 'Instagram Bold' ? 'SAMPLE TEXT' : 'Sample text'}
      </div>
    </div>
  )
}

export default function StylePicker({ selected, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-secondary uppercase tracking-wider">Caption Style</p>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onChange(style.id)}
            className={`flex-shrink-0 w-32 rounded-xl border p-2 transition-all ${
              selected === style.id
                ? 'border-accent bg-accent/10'
                : 'border-border bg-surface hover:border-accent/40'
            }`}
          >
            <StylePreview style={style} />
            <p className={`text-xs font-medium mt-2 text-center ${selected === style.id ? 'text-accent' : 'text-secondary'}`}>
              {style.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

const LANGUAGES = [
  { id: 'en-IN', flag: '🇮🇳', label: 'English (Indian)', example: '"How are you?"' },
  { id: 'hi-EN', flag: '🙏', label: 'Hinglish', example: '"Kaise ho?"' },
  { id: 'mr-EN', flag: '🧡', label: 'MarathiEnglish', example: '"Kashe ahat?"' },
]

export default function LanguageToggle({ selected, onChange }) {
  function toggle(id) {
    if (selected.includes(id)) {
      if (selected.length === 1) return // keep at least one
      onChange(selected.filter((l) => l !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-secondary uppercase tracking-wider">Language</p>
      <div className="flex flex-col gap-2">
        {LANGUAGES.map((lang) => {
          const active = selected.includes(lang.id)
          return (
            <button
              key={lang.id}
              onClick={() => toggle(lang.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                active
                  ? 'border-accent bg-accent/10 text-white'
                  : 'border-border bg-surface text-secondary hover:border-accent/40'
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <div>
                <div className="text-sm font-semibold">{lang.label}</div>
                <div className="text-xs text-secondary">{lang.example}</div>
              </div>
              <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                active ? 'border-accent bg-accent' : 'border-border'
              }`}>
                {active && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

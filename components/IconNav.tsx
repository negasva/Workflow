'use client'

interface IconNavProps {
  mode: 'venta' | 'editor'
  theme: 'light' | 'dark'
  onSetMode: (m: 'venta' | 'editor') => void
  onAddKit: () => void
  onToggleTheme: () => void
  onOpenSearch: () => void
  onOpenExport: () => void
  onOpenShortcuts: () => void
  onFocusKits: () => void
}

interface NavButtonProps {
  active?: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
  highlight?: boolean
}

function NavButton({ active, title, onClick, children, highlight }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all group ${
        active
          ? 'bg-brand text-white shadow-lg shadow-brand/30'
          : highlight
          ? 'text-brand hover:bg-white/5'
          : 'text-zinc-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {children}
      <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-zinc-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-zinc-800">
        {title}
      </span>
    </button>
  )
}

export default function IconNav({
  mode,
  theme,
  onSetMode,
  onAddKit,
  onToggleTheme,
  onOpenSearch,
  onOpenExport,
  onOpenShortcuts,
  onFocusKits,
}: IconNavProps) {
  return (
    <nav className="w-16 shrink-0 bg-[var(--bg-nav)] border-r border-black/40 flex flex-col items-center py-3 gap-1">
      {/* Logo */}
      <div className="w-10 h-10 mb-3 flex items-center justify-center rounded-xl bg-brand/10">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 4V16C8 17.1046 8.89543 18 10 18L18 18C19.1046 18 20 17.1046 20 16V7.24162C20 6.7034 19.7831 6.18789 19.3982 5.81161L16.0829 2.56999C15.7092 2.2046 15.2074 2 14.6847 2H10C8.89543 2 8 2.89543 8 4Z" stroke="#E05A28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V9C4 7.89543 4.89543 7 6 7H8" stroke="#E05A28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <NavButton title="Kits (Home)" onClick={onFocusKits}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </NavButton>

      <NavButton title="Modo Venta" active={mode === 'venta'} onClick={() => onSetMode('venta')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </NavButton>

      <NavButton title="Modo Editor" active={mode === 'editor'} onClick={() => onSetMode('editor')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="12" r="3"/><line x1="9" y1="6" x2="15" y2="11"/><line x1="9" y1="18" x2="15" y2="13"/></svg>
      </NavButton>

      <div className="w-8 h-px bg-white/10 my-2" />

      <NavButton title="Nuevo kit" onClick={onAddKit} highlight>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </NavButton>

      <NavButton title="Buscar nodo (Ctrl+K)" onClick={onOpenSearch}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </NavButton>

      <NavButton title="Exportar / Importar JSON" onClick={onOpenExport}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      </NavButton>

      <NavButton title="Atajos de teclado (?)" onClick={onOpenShortcuts}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01"/><path d="M10 10h.01"/><path d="M14 10h.01"/><path d="M18 10h.01"/><path d="M6 14h.01"/><path d="M18 14h.01"/><path d="M9 14h6"/></svg>
      </NavButton>

      <div className="mt-auto" />

      <NavButton title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} onClick={onToggleTheme}>
        {theme === 'dark' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        )}
      </NavButton>
    </nav>
  )
}

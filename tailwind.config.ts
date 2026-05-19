import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
          soft: '#FFEDD5',
        },
        nodo: {
          inicio: '#8B5CF6',
          yo: '#3B82F6',
          cliente: '#10B981',
        },
        app: {
          bg: 'var(--bg-app)',
          surface: 'var(--bg-surface)',
          'surface-2': 'var(--bg-surface-2)',
          border: 'var(--border)',
          'border-strong': 'var(--border-strong)',
          text: 'var(--text-primary)',
          muted: 'var(--text-muted)',
        },
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        card: '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.04)',
        pop: '0 12px 32px -8px rgb(0 0 0 / 0.18), 0 4px 8px -2px rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [],
}
export default config

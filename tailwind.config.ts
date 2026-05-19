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
        title: ['Berthold', 'Recoleta', 'system-ui', 'sans-serif'],
        sans: ['Recoleta', 'system-ui', 'sans-serif'],
        recoleta: ['Recoleta', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#D4481A',
          hover: '#B83A12',
          soft: '#FAE8E0',
        },
        nodo: {
          inicio: '#1B3A8C',
          yo: '#0D6B5A',
          cliente: '#B83A10',
        },
      },
      borderRadius: {
        node: '18px',
        card: '16px',
        btn: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        card: 'var(--shadow-card)',
        drop: 'var(--shadow-drop)',
        node: 'var(--shadow-node)',
        pop: '0 20px 48px -8px rgb(0 0 0 / 0.22), 0 8px 16px -4px rgb(0 0 0 / 0.10)',
      },
    },
  },
  plugins: [],
}
export default config

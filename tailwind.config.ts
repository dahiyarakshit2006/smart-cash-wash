import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#05070A',
        surface: '#0B0F15',
        raised: '#121821',
        line: 'rgba(255,255,255,0.09)',
        chalk: '#F5F7FA',
        muted: '#7C8794',
        accent: '#00E58F',
        sodium: '#FF9A3C',
        ice: '#BFE6FF',
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.045em',
        widest2: '0.24em',
      },
      maxWidth: { shell: '1240px' },
    },
  },
  plugins: [],
};
export default config;

/** @type {import('tailwindcss').Config} */
// Design tokens sourced verbatim from style.md §2.7 (binding design contract).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: { DEFAULT: '#F4F5F7', sunken: '#F9FAFB' },
        brand: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
        },
        surface: { DEFAULT: '#FFFFFF', hover: '#F3F4F6', sunken: '#F9FAFB' },
        hairline: { DEFAULT: '#EDEEF2', strong: '#E5E7EB', hover: '#CBD5E1' },
        ink: {
          primary: '#0F172A',
          body: '#334155',
          secondary: '#64748B',
          muted: '#94A3B8',
          disabled: '#CBD5E1',
        },
        state: {
          success: '#16A34A',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
          neutral: '#6B7280',
        },
      },
      borderRadius: {
        card: '16px',
        panel: '20px',
        control: '12px',
        chip: '10px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(16,24,40,.04)',
        card: '0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.04)',
        md: '0 2px 4px rgba(16,24,40,.04), 0 6px 16px rgba(16,24,40,.06)',
        lg: '0 8px 24px rgba(16,24,40,.08), 0 2px 6px rgba(16,24,40,.04)',
        pop: '0 12px 32px rgba(16,24,40,.14)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

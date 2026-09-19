/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Enterprise minimal dark palette (#0B1020 theme - Stripe / Linear / Vercel style)
        bg: {
          base: '#0B1020',       // Main viewport background
          sidebar: '#0D1322',    // Sidebar surface
          surface: '#0F1629',    // Card / Section surface
          elevated: '#131C33',   // Hover / Sub-surface
          subtle: '#162035',     // Inputs / insets
          border: '#1E293B',     // Primary border
          borderSubtle: '#192237'// Divider border
        },
        brand: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',        // Enterprise emerald brand
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        slate: {
          850: '#141720',
          900: '#0E1016',
          950: '#090B0E',
        },
        txt: {
          primary: '#F3F4F6',    // High-contrast clean text
          secondary: '#9CA3AF',  // Muted descriptive text
          tertiary: '#6B7280',   // Placeholders, captions
          disabled: '#4B5563',   // Disabled state
        },
        status: {
          emerald: { bg: '#064E3B', text: '#34D399', border: '#059669', badgeBg: 'rgba(16, 185, 129, 0.1)', badgeText: '#10B981', badgeBorder: 'rgba(16, 185, 129, 0.25)' },
          amber: { bg: '#78350F', text: '#FBBF24', border: '#D97706', badgeBg: 'rgba(245, 158, 11, 0.1)', badgeText: '#F59E0B', badgeBorder: 'rgba(245, 158, 11, 0.25)' },
          rose: { bg: '#881337', text: '#FB7185', border: '#E11D48', badgeBg: 'rgba(239, 68, 68, 0.1)', badgeText: '#EF4444', badgeBorder: 'rgba(239, 68, 68, 0.25)' },
          blue: { bg: '#1E3A8A', text: '#60A5FA', border: '#2563EB', badgeBg: 'rgba(59, 130, 246, 0.1)', badgeText: '#3B82F6', badgeBorder: 'rgba(59, 130, 246, 0.25)' },
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          '"JetBrains Mono"',
          '"SF Mono"',
          'Menlo',
          'Consolas',
          'monospace'
        ],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '12px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'panel': '0 4px 12px rgba(0, 0, 0, 0.35)',
        'modal': '0 16px 36px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};

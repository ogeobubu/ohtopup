/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      nav: '1051px',
      sidebar: '768px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        bg: 'var(--ot-bg)',
        paper: 'var(--ot-paper)',
        ink: 'var(--ot-ink)',
        muted: 'var(--ot-muted)',
        line: 'var(--ot-line)',
        accent: {
          DEFAULT: 'var(--ot-accent)',
          dark: '#2445a6',
        },
        tint: 'var(--ot-tint)',
        warm: 'var(--ot-warm)',
        night: '#1b2b3b',
        success: {
          DEFAULT: '#27805d',
          dark: '#84d2b1',
        },
        warning: {
          DEFAULT: '#9a6818',
          dark: '#e1b668',
        },
        danger: {
          DEFAULT: '#b84545',
          dark: '#f49d9d',
          surface: '#f9eeee',
          'surface-dark': '#3c272b',
          ink: '#a73b3b',
          'ink-dark': '#efa3a3',
        },
        admin: {
          teal: '#247366',
          'teal-hover': '#1e6156',
          'teal-active': '#90c8b9',
          chrome: '#1c2931',
          hover: '#263740',
          active: '#2d423f',
          muted: '#91a4af',
          text: '#c0ccd2',
          border: '#394952',
          ring: '#4c606a',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontWeight: {
        thinish: '450',
        mediumish: '550',
        semiboldish: '650',
        brand: '750',
      },
      borderRadius: {
        control: '5px',
        panel: '8px',
        preview: '9px',
      },
      maxWidth: {
        app: '1200px',
        'app-main': '1104px',
        admin: '1344px',
        auth: '370px',
      },
      spacing: {
        sidebar: '232px',
        'sidebar-admin': '224px',
        'sidebar-mobile': '260px',
      },
      zIndex: {
        41: '41',
        43: '43',
        44: '44',
        45: '45',
        46: '46',
        sidebar: '45',
        overlay: '44',
        toggle: '43',
        menu: '46',
        header: '40',
        dropdown: '50',
        modal: '100',
      },
      keyframes: {
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        spin: 'spin 0.6s linear infinite',
      },
    },
  },
  plugins: [],
};

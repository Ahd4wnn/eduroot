/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary, #0F3D2E)',
          light: 'var(--color-primary-light, #1a5c44)',
        },
        accent: {
          DEFAULT: 'var(--color-accent, #C8A96B)',
          light: 'var(--color-accent-light, #d4bc85)',
        },
        bgDark: 'var(--color-bg-dark, #111111)',
        bgLight: 'var(--color-bg-light, #F8F6F2)',
        textSecondary: 'var(--color-text-secondary, #5F6368)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        '3xl': ['1.875rem', { letterSpacing: '-0.02em', lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { letterSpacing: '-0.02em', lineHeight: '2.5rem' }],
        '5xl': ['3rem', { letterSpacing: '-0.02em', lineHeight: '1' }],
        '6xl': ['3.75rem', { letterSpacing: '-0.02em', lineHeight: '1' }],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
        elevated: '0 4px 24px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}

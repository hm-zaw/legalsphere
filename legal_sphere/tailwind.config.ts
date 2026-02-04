import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        '3xl': '2.5rem',
        '4xl': '3rem',
      },
      colors: {
        // Premium pastel palette for cards
        'lavender': '#E8E3F3',
        'sage': '#E8F3E8',
        'sand': '#F3F0E8',
        'rose-pastel': '#FFE8E8',
        'sky-pastel': '#E8F3F3',
        'amber-pastel': '#F3E8D8',
        // Enhanced neutrals
        'neutral-50': '#F3F4F6',
        'neutral-100': '#E5E7EB',
        'neutral-900': '#111827',
      },
      fontFamily: {
        'heading': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'tablet': '0 20px 60px -10px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1)',
        'card': '0 8px 32px -8px rgba(0, 0, 0, 0.1), 0 4px 16px -4px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 12px 40px -10px rgba(0, 0, 0, 0.15), 0 6px 20px -6px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scale-up': 'scale-up 0.2s ease-out',
      },
      keyframes: {
        'scale-up': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.02)' },
        }
      },
      letterSpacing: {
        'tight': '-0.025em',
        'tighter': '-0.05em',
      }
    },
  },
  plugins: [],
};

export default config;

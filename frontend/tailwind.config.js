/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        moon: {
          obsidian: '#210635', // Main Dark Canvas Background
          surface: '#420D4B',  // Card / Surface Container
          royal: '#7B337E',    // Primary Accent / Brand Color
          slate: '#6667AB',    // Secondary Accent / Soft Slate Blue
          pink: '#F5D5E0',     // Typography & Highlight Soft Pink
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      backgroundImage: {
        'moon-gradient': 'linear-gradient(135deg, #7B337E 0%, #6667AB 100%)',
        'moon-surface-glass': 'linear-gradient(180deg, rgba(66, 13, 75, 0.75) 0%, rgba(33, 6, 53, 0.85) 100%)',
        'moon-card-glow': 'radial-gradient(circle at top, rgba(123, 51, 126, 0.25) 0%, rgba(66, 13, 75, 0) 70%)',
      },
      boxShadow: {
        'moon-glow': '0 0 25px -5px rgba(123, 51, 126, 0.45)',
        'moon-card': '0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(245, 213, 224, 0.1)',
      },
    },
  },
  plugins: [],
};

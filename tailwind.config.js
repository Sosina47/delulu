/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        police: {
          cream: '#FAF7EE',
          paper: '#FFFDF9',
          folder: '#EAD9B8',
          charcoal: '#1F2421',
          ink: '#2B2D42',
          red: '#D90429',
          stamp: '#B7094C',
          coral: '#FF6B6B',
          gold: '#E8A838',
          green: '#2B9348',
          amber: '#F4A261',
          tape: '#FEE440',
          muted: '#717874',
        },
      },
      fontFamily: {
        display: ['"Bungee"', 'Impact', 'sans-serif'],
        typewriter: ['"Courier Prime"', '"Courier New"', 'monospace'],
        stamp: ['"Special Elite"', '"Courier New"', 'monospace'],
      },
      boxShadow: {
        folder: '3px 4px 0px 0px rgba(31, 36, 33, 0.9)',
        card: '4px 5px 0px 0px #1F2421',
        stamp: '2px 3px 0px 0px rgba(183, 9, 76, 0.4)',
        button: '2px 3px 0px 0px #1F2421',
        'button-active': '0px 0px 0px 0px #1F2421',
      },
      borderRadius: {
        folder: '8px',
      },
    },
  },
  plugins: [],
};


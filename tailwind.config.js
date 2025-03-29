/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: '#F5F5DC',
  			foreground: '#4A3F35',
  			card: {
  				DEFAULT: '#F5F5DC',
  				foreground: '#4A3F35'
  			},
  			popover: {
  				DEFAULT: '#F5F5DC',
  				foreground: '#4A3F35'
  			},
  			primary: {
  				DEFAULT: '#FF6F61',
  				foreground: '#F5F5DC'
  			},
  			secondary: {
  				DEFAULT: '#F0F0D8',
  				foreground: '#4A3F35'
  			},
  			muted: {
  				DEFAULT: '#EAEACC',
  				foreground: '#6B5C4C'
  			},
  			accent: {
  				DEFAULT: '#FF6F61',
  				foreground: '#F5F5DC'
  			},
  			destructive: {
  				DEFAULT: '#FF453A',
  				foreground: '#F5F5DC'
  			},
  			border: '#D9D9BE',
  			input: '#E0E0C4',
  			ring: '#FF6F61',
  			chart: {
  				'1': '#FF6F61',
  				'2': '#F5D7A1',
  				'3': '#B2D3A8',
  				'4': '#A8C8E1',
  				'5': '#D8B4C8'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}


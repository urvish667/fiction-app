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
  			background: '#FFFFFF',
  			foreground: '#000000',
  			card: {
  				DEFAULT: '#FFFFFF',
  				foreground: '#000000'
  			},
  			popover: {
  				DEFAULT: '#FFFFFF',
  				foreground: '#000000'
  			},
  			primary: {
  				DEFAULT: '#1E90FF',
  				foreground: '#FFFFFF'
  			},
  			secondary: {
  				DEFAULT: '#F0F8FF',
  				foreground: '#000000'
  			},
  			muted: {
  				DEFAULT: '#E5E5E5',
  				foreground: '#4B5563'
  			},
  			accent: {
  				DEFAULT: '#1E90FF',
  				foreground: '#FFFFFF'
  			},
  			destructive: {
  				DEFAULT: '#FF453A',
  				foreground: '#FFFFFF'
  			},
  			border: '#D1D5DB',
  			input: '#E5E5E5',
  			ring: '#1E90FF',
  			chart: {
  				'1': '#1E90FF',
  				'2': '#4169E1',
  				'3': '#00BFFF',
  				'4': '#87CEEB',
  				'5': '#B0E0E6'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}


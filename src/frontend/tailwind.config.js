import typography from '@tailwindcss/typography';
import containerQueries from '@tailwindcss/container-queries';
import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['index.html', 'src/**/*.{js,ts,jsx,tsx,html,css}'],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px'
            }
        },
        extend: {
            fontFamily: {
                sans: ['Varela Round', 'Poppins', 'system-ui', 'sans-serif'],
                body: ['Varela Round', 'Poppins', 'system-ui', 'sans-serif'],
                hero: ['Luckiest Guy', 'cursive'],
                section: ['Bubblegum Sans', 'cursive'],
            },
            colors: {
                border: 'oklch(var(--border))',
                input: 'oklch(var(--input))',
                ring: 'oklch(var(--ring) / <alpha-value>)',
                background: 'oklch(var(--background))',
                foreground: 'oklch(var(--foreground))',
                primary: {
                    DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
                    foreground: 'oklch(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
                    foreground: 'oklch(var(--secondary-foreground))'
                },
                destructive: {
                    DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
                    foreground: 'oklch(var(--destructive-foreground))'
                },
                muted: {
                    DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
                    foreground: 'oklch(var(--muted-foreground) / <alpha-value>)'
                },
                accent: {
                    DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
                    foreground: 'oklch(var(--accent-foreground))'
                },
                popover: {
                    DEFAULT: 'oklch(var(--popover))',
                    foreground: 'oklch(var(--popover-foreground))'
                },
                card: {
                    DEFAULT: 'oklch(var(--card))',
                    foreground: 'oklch(var(--card-foreground))'
                },
                chart: {
                    1: 'oklch(var(--chart-1))',
                    2: 'oklch(var(--chart-2))',
                    3: 'oklch(var(--chart-3))',
                    4: 'oklch(var(--chart-4))',
                    5: 'oklch(var(--chart-5))'
                },
                sidebar: {
                    DEFAULT: 'oklch(var(--sidebar))',
                    foreground: 'oklch(var(--sidebar-foreground))',
                    primary: 'oklch(var(--sidebar-primary))',
                    'primary-foreground': 'oklch(var(--sidebar-primary-foreground))',
                    accent: 'oklch(var(--sidebar-accent))',
                    'accent-foreground': 'oklch(var(--sidebar-accent-foreground))',
                    border: 'oklch(var(--sidebar-border))',
                    ring: 'oklch(var(--sidebar-ring))'
                },
                neon: {
                    pink: 'oklch(0.65 0.30 340)',
                    green: 'oklch(0.75 0.28 140)',
                    cyan: 'oklch(0.70 0.25 200)',
                    purple: 'oklch(0.70 0.30 280)',
                    orange: 'oklch(0.68 0.32 40)',
                },
                scary: {
                    DEFAULT: 'oklch(var(--scary) / <alpha-value>)',
                    foreground: 'oklch(var(--scary-foreground))',
                    glow: 'oklch(var(--scary-glow) / <alpha-value>)',
                },
                'admin-claim': {
                    DEFAULT: 'oklch(var(--admin-claim) / <alpha-value>)',
                    foreground: 'oklch(var(--admin-claim-foreground))',
                    glow: 'oklch(var(--admin-claim-glow) / <alpha-value>)',
                }
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            boxShadow: {
                xs: '0 1px 2px 0 rgba(0,0,0,0.05)',
                'neon-sm': '0 0 10px currentColor',
                'neon-md': '0 0 15px currentColor, 0 0 30px currentColor',
                'neon-lg': '0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor',
                'neon-pink': '0 0 20px oklch(0.65 0.30 340), 0 0 40px oklch(0.65 0.30 340)',
                'neon-green': '0 0 20px oklch(0.75 0.28 140), 0 0 40px oklch(0.75 0.28 140)',
                'neon-cyan': '0 0 20px oklch(0.70 0.25 200), 0 0 40px oklch(0.70 0.25 200)',
                'neon-purple': '0 0 20px oklch(0.70 0.30 280), 0 0 40px oklch(0.70 0.30 280)',
                'neon-orange': '0 0 20px oklch(0.68 0.32 40), 0 0 40px oklch(0.68 0.32 40)',
                'scary-md': '0 0 15px oklch(var(--scary-glow)), 0 0 30px oklch(var(--scary-glow))',
                'scary-lg': '0 0 20px oklch(var(--scary-glow)), 0 0 40px oklch(var(--scary-glow)), 0 0 60px oklch(var(--scary-glow))',
                'admin-claim-md': '0 0 15px oklch(var(--admin-claim-glow)), 0 0 30px oklch(var(--admin-claim-glow))',
                'admin-claim-lg': '0 0 20px oklch(var(--admin-claim-glow)), 0 0 40px oklch(var(--admin-claim-glow)), 0 0 60px oklch(var(--admin-claim-glow))',
            },
            textShadow: {
                'neon-sm': '0 0 8px currentColor',
                'neon-md': '0 0 10px currentColor, 0 0 20px currentColor',
                'neon-lg': '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                },
                'neon-pulse': {
                    '0%, 100%': { 
                        boxShadow: '0 0 10px currentColor, 0 0 20px currentColor',
                        textShadow: '0 0 8px currentColor'
                    },
                    '50%': { 
                        boxShadow: '0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor',
                        textShadow: '0 0 12px currentColor, 0 0 24px currentColor'
                    }
                },
                'admin-claim-pulse': {
                    '0%, 100%': { boxShadow: '0 0 12px oklch(var(--admin-claim-glow)), 0 0 24px oklch(var(--admin-claim-glow))' },
                    '50%': { boxShadow: '0 0 20px oklch(var(--admin-claim-glow)), 0 0 40px oklch(var(--admin-claim-glow)), 0 0 60px oklch(var(--admin-claim-glow))' }
                },
                'scary-flicker': {
                    '0%, 41%, 43%, 46%, 100%': { opacity: '1' },
                    '42%': { opacity: '0.6' },
                    '45%': { opacity: '0.4' },
                    '78%': { opacity: '0.5' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
                'admin-claim-pulse': 'admin-claim-pulse 2.4s ease-in-out infinite',
                'scary-flicker': 'scary-flicker 3s linear infinite'
            }
        }
    },
    plugins: [
        typography, 
        containerQueries, 
        animate,
        function({ addUtilities }) {
            const newUtilities = {
                '.text-shadow-neon-sm': {
                    textShadow: '0 0 8px currentColor',
                },
                '.text-shadow-neon-md': {
                    textShadow: '0 0 10px currentColor, 0 0 20px currentColor',
                },
                '.text-shadow-neon-lg': {
                    textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
                },
            }
            addUtilities(newUtilities)
        }
    ]
};

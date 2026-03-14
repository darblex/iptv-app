# Tailwind Config — IPTV ישראלי
**tailwind.config.ts / tailwind-config.md v1.0**

---

## Full `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  // Dark mode via class (add 'dark' to <html>)
  darkMode: 'class',
  
  // Content paths
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  
  theme: {
    // RTL-first: direction is set in CSS/HTML, not Tailwind
    extend: {
      
      // ─── Colors ──────────────────────────────────────────────
      colors: {
        // Background scale
        bg: {
          base:     '#0A0A0F',
          elevated: '#12121A',
          surface:  '#1A1A26',
          overlay:  '#22223A',
          glass:    'rgba(18,18,26,0.85)',
        },
        
        // Primary — Israeli blue
        primary: {
          DEFAULT: '#2563EB',
          light:   '#3B82F6',
          dark:    '#1D4ED8',
          glow:    'rgba(37,99,235,0.35)',
        },
        
        // Accent — gold
        accent: {
          DEFAULT: '#F59E0B',
          light:   '#FCD34D',
          dark:    '#D97706',
          glow:    'rgba(245,158,11,0.3)',
        },
        
        // Status colors
        live:  '#EF4444',
        new:   '#10B981',
        hd:    '#8B5CF6',
        
        // Text scale
        text: {
          primary:   '#F1F5F9',
          secondary: '#94A3B8',
          muted:     '#475569',
          inverse:   '#0A0A0F',
        },
        
        // Borders
        border: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          focus:   'rgba(37,99,235,0.6)',
          divider: 'rgba(255,255,255,0.05)',
        },
      },
      
      // ─── Typography ──────────────────────────────────────────
      fontFamily: {
        heebo: ['Heebo', 'sans-serif'],
        rubik: ['Rubik', 'sans-serif'],
        sans:  ['Heebo', 'Rubik', 'system-ui', 'sans-serif'],
      },
      
      fontSize: {
        'display': ['3rem',     { lineHeight: '1.1', fontWeight: '800' }],
        'hero':    ['2.25rem',  { lineHeight: '1.2', fontWeight: '700' }],
        'title':   ['1.5rem',   { lineHeight: '1.3', fontWeight: '700' }],
        'subtitle':['1.25rem',  { lineHeight: '1.4', fontWeight: '600' }],
        'body':    ['1rem',     { lineHeight: '1.6', fontWeight: '400' }],
        'small':   ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'xs':      ['0.75rem',  { lineHeight: '1.4', fontWeight: '500' }],
      },
      
      // ─── Spacing ─────────────────────────────────────────────
      spacing: {
        '4.5': '1.125rem',  // 18px
        '13':  '3.25rem',   // 52px
        '15':  '3.75rem',   // 60px
        '18':  '4.5rem',    // 72px (nav height)
        '22':  '5.5rem',    // 88px
        '26':  '6.5rem',    // 104px
        '30':  '7.5rem',    // 120px
      },
      
      // ─── Border Radius ───────────────────────────────────────
      borderRadius: {
        'xs':  '2px',
        'sm':  '4px',
        'md':  '8px',
        'lg':  '12px',
        'xl':  '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      
      // ─── Box Shadow ──────────────────────────────────────────
      boxShadow: {
        'sm':      '0 1px 3px rgba(0,0,0,0.5)',
        'md':      '0 4px 16px rgba(0,0,0,0.6)',
        'lg':      '0 8px 32px rgba(0,0,0,0.7)',
        'xl':      '0 16px 48px rgba(0,0,0,0.8)',
        
        'glow-primary': '0 0 20px rgba(37,99,235,0.4), 0 0 40px rgba(37,99,235,0.2)',
        'glow-accent':  '0 0 20px rgba(245,158,11,0.4), 0 0 40px rgba(245,158,11,0.2)',
        'glow-live':    '0 0 8px rgba(239,68,68,0.6)',
        
        'card-hover': '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(37,99,235,0.3)',
        'modal':      '0 24px 80px rgba(0,0,0,0.9)',
        'nav':        '0 2px 20px rgba(0,0,0,0.5)',
        
        'inner-top': 'inset 0 2px 4px rgba(0,0,0,0.3)',
      },
      
      // ─── Breakpoints ─────────────────────────────────────────
      screens: {
        'xs':  '480px',   // small mobile landscape
        'sm':  '640px',   // mobile
        'md':  '768px',   // tablet
        'lg':  '1024px',  // small desktop
        'xl':  '1280px',  // desktop
        '2xl': '1536px',  // large / TV
        '3xl': '1920px',  // full HD TV
      },
      
      // ─── Aspect Ratios ───────────────────────────────────────
      aspectRatio: {
        'poster':  '2 / 3',
        'banner':  '21 / 9',
        'card':    '16 / 9',
        'square':  '1 / 1',
        'channel': '4 / 3',
      },
      
      // ─── Background Images ───────────────────────────────────
      backgroundImage: {
        // Gradient overlays
        'gradient-card-hover':
          'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
        
        'gradient-banner-bottom':
          'linear-gradient(to top, #0A0A0F 0%, rgba(10,10,15,0.6) 40%, transparent 100%)',
        
        'gradient-banner-rtl':
          'linear-gradient(to left, transparent 40%, rgba(10,10,15,0.8) 100%)',
        
        'gradient-nav':
          'linear-gradient(to bottom, rgba(10,10,15,0.9) 0%, transparent 100%)',
        
        'gradient-sidebar':
          'linear-gradient(135deg, rgba(37,99,235,0.05) 0%, transparent 100%)',
      },
      
      // ─── Animations ──────────────────────────────────────────
      animation: {
        'fade-in':       'fadeIn 300ms ease forwards',
        'fade-out':      'fadeOut 200ms ease forwards',
        'slide-up':      'slideUp 350ms cubic-bezier(0.4,0,0.2,1) forwards',
        'slide-down':    'slideDown 350ms cubic-bezier(0.4,0,0.2,1) forwards',
        'slide-in-right':'slideInRight 300ms ease forwards',
        'banner-cross':  'bannerCross 700ms cubic-bezier(0.4,0,0.2,1)',
        'shimmer':       'shimmer 1.5s infinite linear',
        'pulse-live':    'pulseLive 2s ease-in-out infinite',
        'scale-in':      'scaleIn 200ms cubic-bezier(0.4,0,0.2,1) forwards',
      },
      
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOut: {
          from: { opacity: '1' },
          to:   { opacity: '0' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-100%)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        bannerCross: {
          '0%':   { opacity: '0' },
          '20%':  { opacity: '1' },
          '80%':  { opacity: '1' },
          '100%': { opacity: '0' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseLive: {
          '0%, 100%': { boxShadow: '0 0 4px rgba(239,68,68,0.4)' },
          '50%':       { boxShadow: '0 0 12px rgba(239,68,68,0.8)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
      
      // ─── Transition Duration ─────────────────────────────────
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
      },
      
      // ─── Z-Index ─────────────────────────────────────────────
      zIndex: {
        'nav':      '40',
        'overlay':  '50',
        'modal':    '60',
        'player':   '70',
        'toast':    '80',
        'tooltip':  '90',
      },
      
      // ─── Max Width ───────────────────────────────────────────
      maxWidth: {
        'content': '1400px',  // max content width
        'prose-rtl': '65ch',
      },
      
      // ─── Min Height ──────────────────────────────────────────
      minHeight: {
        'hero':   '320px',
        'banner': '400px',
        'screen-nav': 'calc(100vh - 64px)',
      },
    },
  },
  
  // ─── Plugins ───────────────────────────────────────────────
  plugins: [
    // RTL support
    require('tailwindcss-rtl'),
    
    // Line clamp (built-in Tailwind v3.3+, but explicit for clarity)
    // require('@tailwindcss/line-clamp'),
    
    // Custom utilities plugin
    function({ addUtilities, addComponents, theme }: any) {
      addUtilities({
        // Hide scrollbar
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
        
        // iOS safe areas
        '.safe-area-pb': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.safe-area-pt': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        
        // Text RTL helpers
        '.text-start': { 'text-align': 'right' },  // RTL: start = right
        '.text-end':   { 'text-align': 'left' },
        
        // Gradient text
        '.text-gradient-primary': {
          'background': 'linear-gradient(135deg, #2563EB, #60A5FA)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-gradient-gold': {
          'background': 'linear-gradient(135deg, #F59E0B, #FCD34D)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        
        // Glassmorphism
        '.glass': {
          'background': 'rgba(18,18,26,0.8)',
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255,255,255,0.08)',
        },
        '.glass-dark': {
          'background': 'rgba(10,10,15,0.9)',
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
        },
      })
      
      addComponents({
        // Live badge
        '.badge-live': {
          '@apply bg-red-500 text-white text-[10px] font-bold': {},
          '@apply px-2 py-0.5 rounded-full uppercase': {},
          '@apply inline-flex items-center gap-1': {},
          '@apply shadow-[0_0_8px_rgba(239,68,68,0.6)]': {},
        },
        
        // Card base
        '.card-base': {
          '@apply bg-bg-elevated rounded-xl overflow-hidden': {},
          '@apply border border-white/5': {},
          '@apply transition-all duration-200': {},
          '@apply hover:border-white/10': {},
        },
        
        // Section header
        '.section-header': {
          '@apply flex items-center justify-between px-4 mb-3': {},
        },
        
        // Horizontal scroll row
        '.scroll-row': {
          '@apply flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide': {},
          '@apply scroll-smooth': {},
        },
      })
    },
  ],
}

export default config
```

---

## `globals.css` — Base Styles

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&family=Rubik:wght@400;500;600;700&display=swap');

/* RTL base */
@layer base {
  html {
    direction: rtl;
    scroll-behavior: smooth;
    -webkit-text-size-adjust: 100%;
  }
  
  body {
    @apply bg-bg-base text-text-primary font-heebo antialiased;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }
  
  /* Dark scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.03);
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.15);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.25);
  }
  
  /* Focus outline */
  :focus-visible {
    @apply outline-none ring-2 ring-primary/60 ring-offset-1 ring-offset-bg-base;
  }
  
  /* Selection */
  ::selection {
    @apply bg-primary/30 text-white;
  }
}

/* PWA viewport fix */
@supports (padding: env(safe-area-inset-bottom)) {
  .bottom-nav-safe {
    padding-bottom: calc(env(safe-area-inset-bottom) + 0.5rem);
  }
}
```

---

## `index.html` — PWA Meta Tags

```html
<!DOCTYPE html>
<html lang="he" dir="rtl" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  
  <!-- PWA -->
  <meta name="theme-color" content="#0A0A0F" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="MyIPTV" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  
  <!-- Preload fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  
  <!-- App name -->
  <title>MyIPTV — ישראלי</title>
</head>
```

---

## `manifest.json` — PWA Manifest

```json
{
  "name": "MyIPTV",
  "short_name": "MyIPTV",
  "description": "ישראלי IPTV - טלוויזיה, סרטים וסדרות",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#0A0A0F",
  "theme_color": "#0A0A0F",
  "lang": "he",
  "dir": "rtl",
  "icons": [
    { "src": "/icons/icon-72.png",   "sizes": "72x72",   "type": "image/png" },
    { "src": "/icons/icon-96.png",   "sizes": "96x96",   "type": "image/png" },
    { "src": "/icons/icon-128.png",  "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144.png",  "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152.png",  "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192.png",  "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-384.png",  "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512.png",  "sizes": "512x512", "type": "image/png" }
  ],
  "shortcuts": [
    {
      "name": "טלוויזיה חיה",
      "url": "/live",
      "icons": [{ "src": "/icons/shortcut-live.png", "sizes": "96x96" }]
    },
    {
      "name": "סרטים",
      "url": "/movies",
      "icons": [{ "src": "/icons/shortcut-movies.png", "sizes": "96x96" }]
    }
  ]
}
```

---

## Responsive Grid Patterns

### Channel Grid
```jsx
<div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
```

### Movie Poster Grid  
```jsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4 p-4">
```

### Series Thumbnail Grid
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
```

### Page Layout (with SideNav)
```jsx
<div className="flex flex-row-reverse min-h-screen bg-bg-base">
  <aside className="hidden md:flex flex-col fixed right-0 top-0 h-screen w-20 lg:w-64 z-40" />
  <main className="flex-1 md:mr-20 lg:mr-64 pb-16 md:pb-0">
    {/* content */}
  </main>
  <BottomNav className="md:hidden" />
</div>
```
> Note: `flex-row-reverse` + `mr-*` on main handles RTL sidebar correctly.

---

## Key Tailwind Class Quick Reference

| Element | Classes |
|---------|---------|
| Page bg | `bg-bg-base min-h-screen` |
| Card | `bg-bg-elevated rounded-xl border border-white/5` |
| Card hover | `hover:scale-105 hover:shadow-card-hover transition-all duration-200` |
| Primary button | `bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl` |
| Ghost button | `bg-white/5 hover:bg-white/10 border border-white/10 text-text-primary` |
| Section title | `text-xl font-bold font-heebo text-text-primary` |
| Muted text | `text-sm text-text-muted` |
| Glass overlay | `bg-bg-base/90 backdrop-blur-xl` |
| Live badge | `bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse` |
| Progress bar | `h-1 bg-primary rounded-full` |
| Horizontal scroll | `flex gap-3 overflow-x-auto scrollbar-hide pb-2` |
| RTL input | `text-right dir="rtl" placeholder:text-text-muted` |
| Bottom nav | `fixed bottom-0 inset-x-0 bg-bg-base/95 backdrop-blur-xl border-t border-white/5` |
| Sticky nav | `sticky top-0 z-nav bg-bg-base/95 backdrop-blur-xl` |

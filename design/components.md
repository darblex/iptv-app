# קומפוננטים — IPTV ישראלי
**Component Specifications v1.0**

---

## 1. 🎥 VideoPlayer

### Overview
HLS.js based full-featured player with Hebrew UI overlay.

### Props Interface
```typescript
interface VideoPlayerProps {
  src: string;           // HLS stream URL
  poster?: string;       // thumbnail
  title?: string;        // show above controls
  isLive?: boolean;      // show LIVE badge + red dot
  subtitles?: SubTrack[];
  onBack?: () => void;
  autoPlay?: boolean;
}
```

### Layout
```
┌─────────────────────────────────────┐
│  [← חזרה]            [כותרת]       │  ← top bar (fades)
│                                     │
│                 ▶▶                  │  ← center play/pause
│                                     │
│  [🔊] [CC] [⚙] [⛶]  ██████░░░░ 45:23 │  ← bottom controls bar
└─────────────────────────────────────┘
```

### Controls (Hebrew labels)
```tsx
// Bottom controls bar
<div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent
            px-4 py-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100
            transition-opacity duration-300">
  
  {/* Progress bar */}
  <div class="w-full h-1 bg-white/20 rounded-full cursor-pointer
              hover:h-1.5 transition-all">
    <div class="h-full bg-primary rounded-full relative" style={{width: `${progress}%`}}>
      <div class="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3
                  bg-white rounded-full shadow-lg" />
    </div>
  </div>
  
  {/* Controls row — RTL */}
  <div class="flex items-center justify-between">
    {/* Right side (RTL = start) */}
    <div class="flex items-center gap-3">
      <button aria-label="הפעל/עצור">▶</button>
      <button aria-label="קדימה 10 שניות">+10</button>
      <button aria-label="אחורה 10 שניות">-10</button>
      <span class="text-xs text-white/70">23:45 / 1:30:00</span>
    </div>
    
    {/* Left side */}
    <div class="flex items-center gap-3">
      <button aria-label="כתוביות">CC</button>
      <button aria-label="שמע">🔊</button>
      <button aria-label="הגדרות">⚙</button>
      <button aria-label="מסך מלא">⛶</button>
    </div>
  </div>
</div>
```

### Live Player Additions
```tsx
// Top-right LIVE badge
<div class="absolute top-4 left-4 flex items-center gap-1.5
            bg-red-500 text-white text-xs font-bold
            px-2 py-1 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]">
  <span class="w-2 h-2 bg-white rounded-full animate-pulse" />
  בשידור חי
</div>
```

### Settings Panel (inside player)
```
Overlay slide-up panel:
- איכות: [אוטו] [1080p] [720p] [480p]
- שמע: [עברית] [ערבית] [אנגלית]
- כתוביות: [כבוי] [עברית] [ערבית]
- מהירות: [0.5×] [0.75×] [רגיל] [1.25×] [1.5×] [2×]
```

### HLS.js Init Code
```javascript
import Hls from 'hls.js';

const initPlayer = (videoEl, src) => {
  if (Hls.isSupported()) {
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,  // for live
      backBufferLength: 90,
    });
    hls.loadSource(src);
    hls.attachMedia(videoEl);
  } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari native HLS
    videoEl.src = src;
  }
};
```

---

## 2. 📺 ChannelCard

### Variants
- `grid` — square card for channel grid (default)
- `list` — horizontal row for EPG view
- `mini` — compact for favorites strip

### Grid Variant
```tsx
<div class="relative group bg-bg-elevated rounded-xl overflow-hidden
            cursor-pointer transition-all duration-200
            hover:scale-105 hover:shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_0_1px_rgba(37,99,235,0.4)]">
  
  {/* Thumbnail / logo area */}
  <div class="aspect-video flex items-center justify-center bg-bg-surface p-4">
    <img src={channel.logo} alt={channel.name}
         class="max-h-12 max-w-[80%] object-contain" />
  </div>
  
  {/* Info bar */}
  <div class="px-3 py-2">
    <p class="text-sm font-semibold text-text-primary truncate">{channel.name}</p>
    <p class="text-xs text-text-muted truncate mt-0.5">{channel.currentProgram}</p>
  </div>
  
  {/* LIVE badge */}
  {channel.isLive && (
    <div class="absolute top-2 right-2 bg-red-500 text-white text-[10px]
                font-bold px-1.5 py-0.5 rounded-full
                flex items-center gap-1">
      <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
      חי
    </div>
  )}
  
  {/* Favorite */}
  <button class="absolute top-2 left-2 text-text-muted hover:text-yellow-400
                 transition-colors" aria-label="הוסף למועדפים">
    ★
  </button>
</div>
```

---

## 3. 🎬 MovieCard

### Poster Variant (2:3 ratio)
```tsx
<div class="relative group cursor-pointer
            transition-transform duration-200 hover:scale-105 hover:z-10">
  
  {/* Poster image */}
  <div class="aspect-[2/3] rounded-lg overflow-hidden bg-bg-elevated">
    <img src={movie.poster} alt={movie.title}
         class="w-full h-full object-cover
                group-hover:brightness-75 transition-all duration-200" />
  </div>
  
  {/* Hover overlay */}
  <div class="absolute inset-0 rounded-lg flex flex-col justify-end
              bg-gradient-to-t from-black/90 via-black/20 to-transparent
              opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2">
    <p class="text-xs font-semibold text-white truncate">{movie.title}</p>
    <div class="flex items-center gap-1 mt-1">
      <span class="text-yellow-400 text-xs">★ {movie.rating}</span>
      <span class="text-white/50 text-xs">· {movie.year}</span>
    </div>
    <button class="mt-2 w-full bg-primary text-white text-xs font-semibold
                   py-1.5 rounded-md">
      ▶ צפה
    </button>
  </div>
  
  {/* Quality badge */}
  {movie.quality === '4K' && (
    <div class="absolute top-2 left-2 bg-yellow-500 text-black text-[10px]
                font-bold px-1.5 py-0.5 rounded">4K</div>
  )}
  {movie.isNew && (
    <div class="absolute top-2 right-2 bg-green-500 text-white text-[10px]
                font-bold px-1.5 py-0.5 rounded">חדש</div>
  )}
</div>
```

### Landscape Variant (16:9, for continue watching)
```tsx
<div class="relative group w-48 md:w-56 flex-shrink-0 cursor-pointer
            transition-transform duration-200 hover:scale-105">
  <div class="aspect-video rounded-lg overflow-hidden bg-bg-elevated">
    <img src={item.thumbnail} alt={item.title}
         class="w-full h-full object-cover" />
    {/* Progress bar */}
    <div class="absolute bottom-0 inset-x-0 h-1 bg-white/20">
      <div class="h-full bg-primary" style={{width: `${item.progress}%`}} />
    </div>
  </div>
  <p class="text-xs text-text-secondary mt-1.5 truncate">{item.title}</p>
  <p class="text-xs text-text-muted">{item.remainingMin} דקות נותרו</p>
</div>
```

---

## 4. 📺 SeriesCard

```tsx
// Similar to MovieCard landscape but with episode info
<div class="relative group cursor-pointer
            transition-transform duration-200 hover:scale-105">
  <div class="aspect-video rounded-xl overflow-hidden bg-bg-elevated">
    <img src={series.thumbnail} alt={series.title}
         class="w-full h-full object-cover" />
    {/* Season/episode badge */}
    <div class="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm
                text-white text-xs px-2 py-0.5 rounded-full">
      {series.seasons} עונות
    </div>
  </div>
  <p class="text-sm font-semibold text-text-primary mt-2 truncate">{series.title}</p>
  <p class="text-xs text-text-muted">{series.genre}</p>
</div>
```

---

## 5. 📊 CategoryBar

### Section Header + Horizontal Scroll Row
```tsx
<section class="mb-6">
  {/* Section header */}
  <div class="flex items-center justify-between px-4 mb-3">
    <h2 class="text-lg font-bold text-text-primary font-heebo">{title}</h2>
    <button class="text-sm text-primary hover:text-primary-light transition-colors
                   flex items-center gap-1">
      הצג הכל
      <ChevronLeft class="w-4 h-4" /> {/* RTL: left arrow = forward */}
    </button>
  </div>
  
  {/* Scrollable row */}
  <div class="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide
              scroll-smooth snap-x snap-mandatory">
    {children}
  </div>
</section>
```

### CSS for hidden scrollbar
```css
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar { display: none; }
```

---

## 6. 📅 EPGTimeline

### Horizontal EPG Strip
```tsx
<div class="relative overflow-x-auto bg-bg-elevated rounded-xl p-3">
  {/* Time header */}
  <div class="flex gap-0 mb-2 pr-20"> {/* pr-20 = channel name width */}
    {timeSlots.map(time => (
      <div class="flex-shrink-0 w-32 text-xs text-text-muted text-right pr-2">
        {time} {/* e.g. 20:00 */}
      </div>
    ))}
  </div>
  
  {/* Channel rows */}
  {channels.map(channel => (
    <div class="flex items-center mb-1 gap-2">
      {/* Channel name */}
      <div class="w-20 flex-shrink-0 text-xs font-medium text-text-secondary truncate">
        {channel.name}
      </div>
      
      {/* Programs */}
      <div class="flex gap-1 overflow-hidden">
        {channel.programs.map(prog => (
          <button
            style={{width: `${prog.durationMin * 2}px`}} // 2px per minute
            class="flex-shrink-0 h-10 rounded-md text-xs text-right px-2
                   bg-bg-surface hover:bg-primary/20 border border-white/5
                   hover:border-primary/40 transition-colors truncate
                   data-[current=true]:bg-primary/30 data-[current=true]:border-primary">
            {prog.title}
          </button>
        ))}
      </div>
    </div>
  ))}
  
  {/* Current time indicator */}
  <div class="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none
              shadow-[0_0_8px_rgba(239,68,68,0.8)]"
       style={{right: `${currentTimeOffset}px`}} />
</div>
```

---

## 7. 🔍 SearchBar

```tsx
<div class="relative w-full">
  <div class="flex items-center bg-bg-elevated border border-white/10
              rounded-xl px-4 py-3 gap-3
              focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]
              transition-all duration-200">
    
    {/* Search icon (right side in RTL) */}
    <Search class="w-5 h-5 text-text-muted flex-shrink-0" />
    
    <input
      type="search"
      placeholder="חפש סרטים, ערוצים, סדרות..."
      class="flex-1 bg-transparent text-text-primary placeholder:text-text-muted
             text-base outline-none text-right"
      dir="rtl"
    />
    
    {/* Clear button */}
    {value && (
      <button class="text-text-muted hover:text-text-primary transition-colors">
        ✕
      </button>
    )}
  </div>
  
  {/* Suggestions dropdown */}
  {suggestions.length > 0 && (
    <div class="absolute top-full mt-2 inset-x-0 bg-bg-elevated
                border border-white/10 rounded-xl overflow-hidden z-50
                shadow-xl">
      {suggestions.map(s => (
        <button class="w-full flex items-center gap-3 px-4 py-3 text-right
                       hover:bg-white/5 transition-colors border-b border-white/5
                       last:border-0">
          <span class="text-sm text-text-primary">{s.title}</span>
          <span class="text-xs text-text-muted me-auto">{s.type}</span>
        </button>
      ))}
    </div>
  )}
</div>
```

---

## 8. 📱 BottomNav (Mobile)

```tsx
// Mobile only: hidden md:hidden
<nav class="fixed bottom-0 inset-x-0 z-40 md:hidden
            bg-bg-base/95 backdrop-blur-xl
            border-t border-white/5
            safe-area-pb"> {/* for iPhone notch */}
  
  <div class="flex items-center justify-around px-2 py-2">
    {navItems.map(item => (
      <NavLink to={item.path}
               class="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl
                      text-text-muted hover:text-text-primary transition-colors
                      aria-[current=page]:text-primary">
        <item.Icon class="w-6 h-6" />
        <span class="text-[10px] font-medium">{item.label}</span>
      </NavLink>
    ))}
  </div>
</nav>

// Nav items:
// { icon: Home,   label: "בית",    path: "/" }
// { icon: Tv2,    label: "ערוצים", path: "/live" }
// { icon: Film,   label: "סרטים",  path: "/movies" }
// { icon: Play,   label: "סדרות",  path: "/series" }
// { icon: Search, label: "חיפוש",  path: "/search" }
```

---

## 9. 🖥️ SideNav (Desktop)

```tsx
// Desktop only: hidden on mobile, visible md:flex
<aside class="hidden md:flex flex-col fixed right-0 top-0 h-screen z-40
              w-20 lg:w-64
              bg-bg-elevated border-l border-white/5
              transition-all duration-300">
  
  {/* Logo */}
  <div class="h-16 flex items-center justify-center lg:justify-end px-4
              border-b border-white/5">
    <img src="/logo.svg" class="h-8 lg:h-10" />
  </div>
  
  {/* Nav items */}
  <nav class="flex-1 py-6 px-2 flex flex-col gap-1">
    {navItems.map(item => (
      <NavLink to={item.path}
               class="flex items-center gap-3 px-3 py-3 rounded-xl
                      text-text-muted hover:text-text-primary hover:bg-white/5
                      transition-all duration-200
                      aria-[current=page]:text-primary aria-[current=page]:bg-primary/10">
        <item.Icon class="w-5 h-5 flex-shrink-0" />
        <span class="hidden lg:block text-sm font-medium">{item.label}</span>
      </NavLink>
    ))}
  </nav>
  
  {/* User section */}
  <div class="border-t border-white/5 p-4">
    <button class="flex items-center gap-3 w-full text-right">
      <Avatar class="w-8 h-8 rounded-full flex-shrink-0" />
      <div class="hidden lg:block min-w-0">
        <p class="text-sm font-medium text-text-primary truncate">{user.name}</p>
        <p class="text-xs text-text-muted">הגדרות</p>
      </div>
    </button>
  </div>
</aside>
```

---

## 10. 🎪 FeaturedBanner

```tsx
<div class="relative overflow-hidden rounded-2xl h-[55vh] min-h-72 max-h-[600px]">
  
  {/* Background images (crossfade) */}
  {items.map((item, i) => (
    <div key={i}
         class="absolute inset-0 transition-opacity duration-700"
         style={{opacity: i === activeIndex ? 1 : 0}}>
      <img src={item.backdrop}
           class="w-full h-full object-cover" />
    </div>
  ))}
  
  {/* Gradients */}
  <div class="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/40 to-transparent" />
  <div class="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-bg-base/60" />
  {/* RTL: gradient from left (language start = right) */}
  
  {/* Content overlay */}
  <div class="absolute bottom-0 right-0 p-6 md:p-10 max-w-lg">
    {/* Genre pills */}
    <div class="flex gap-2 mb-3 flex-wrap">
      {activeItem.genres.map(g => (
        <span class="text-xs text-white/70 bg-white/10 backdrop-blur-sm
                     px-2.5 py-1 rounded-full border border-white/15">
          {g}
        </span>
      ))}
    </div>
    
    {/* Title */}
    <h1 class="font-rubik text-3xl md:text-5xl font-bold text-white leading-tight mb-3">
      {activeItem.title}
    </h1>
    
    {/* Meta */}
    <div class="flex items-center gap-3 text-sm text-white/60 mb-4">
      <span class="text-yellow-400 font-semibold">★ {activeItem.rating}</span>
      <span>·</span>
      <span>{activeItem.year}</span>
      <span>·</span>
      <span>{activeItem.duration}</span>
    </div>
    
    {/* Synopsis */}
    <p class="text-sm text-white/75 line-clamp-2 mb-6 leading-relaxed">
      {activeItem.synopsis}
    </p>
    
    {/* CTA Buttons */}
    <div class="flex gap-3">
      <button class="flex items-center gap-2 bg-primary hover:bg-primary/90
                     text-white font-semibold px-6 py-3 rounded-xl
                     shadow-[0_0_20px_rgba(37,99,235,0.4)]
                     transition-all duration-200">
        ▶ צפה עכשיו
      </button>
      <button class="flex items-center gap-2 bg-white/10 hover:bg-white/20
                     backdrop-blur-sm text-white font-semibold px-6 py-3 rounded-xl
                     border border-white/20 transition-all duration-200">
        + הוסף לרשימה
      </button>
    </div>
  </div>
  
  {/* Dots indicator */}
  <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
    {items.map((_, i) => (
      <button
        onClick={() => setActiveIndex(i)}
        class="h-1.5 rounded-full transition-all duration-300 bg-white/40
               data-[active=true]:w-6 data-[active=true]:bg-white w-1.5">
      </button>
    ))}
  </div>
</div>
```

---

## 11. 🏷️ Badges & Pills

```tsx
// Live badge
<span class="inline-flex items-center gap-1 bg-red-500 text-white text-[10px]
             font-bold px-2 py-0.5 rounded-full uppercase">
  <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
  חי
</span>

// Quality badges
<span class="bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">4K</span>
<span class="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">HD</span>

// New badge
<span class="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">חדש</span>

// Genre pill
<span class="text-xs text-white/70 bg-white/8 px-3 py-1 rounded-full
             border border-white/10 hover:bg-white/15 cursor-pointer transition-colors">
  אקשן
</span>
```

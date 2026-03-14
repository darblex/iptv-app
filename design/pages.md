# מפרט עמודים — IPTV ישראלי
**Page Specifications v1.0**

---

## 1. 🏠 דף בית (Home)

### Layout Structure
```
┌─────────────────────────────────┐
│  TopNav (sticky, glassmorphism) │
├─────────────────────────────────┤
│  FeaturedBanner (hero, 50vh)    │
├─────────────────────────────────┤
│  CategoryBar — "המשך צפייה"     │
│  [ContinueCard × N scrollable]  │
├─────────────────────────────────┤
│  CategoryBar — "מגמות עכשיו"    │
│  [MovieCard × N scrollable]     │
├─────────────────────────────────┤
│  CategoryBar — "ערוצים חיים"    │
│  [ChannelCard × N]              │
├─────────────────────────────────┤
│  CategoryBar — "סרטים חדשים"    │
│  [MovieCard × N scrollable]     │
├─────────────────────────────────┤
│  CategoryBar — "סדרות פופולריות"│
│  [SeriesCard × N scrollable]    │
├─────────────────────────────────┤
│  BottomNav (mobile only)        │
└─────────────────────────────────┘
```

### Components Used
- `FeaturedBanner` — auto-rotating hero with gradient overlay
- `CategoryBar` — section header with "הצג הכל" link
- `ContinueCard` — 16:9 thumb + progress bar + resume button
- `MovieCard`, `SeriesCard`, `ChannelCard` — content cards
- `TopNav` (sticky, translucent on scroll)
- `BottomNav` (mobile) / `SideNav` (desktop)

### TopNav Spec
```
Height: 64px mobile / 72px desktop
Background: rgba(10,10,15,0) → rgba(10,10,15,0.95) on scroll
Blur: backdrop-blur-xl

Content (RTL order):
  [Logo (right)] [SearchIcon] [NotifIcon] [Avatar] (left side)

Desktop adds: [דף בית] [טלוויזיה חיה] [סרטים] [סדרות] nav links

Classes:
  <header class="fixed top-0 inset-x-0 z-50 flex items-center justify-between
                 px-4 md:px-8 h-16 md:h-18
                 bg-gradient-to-b from-black/60 to-transparent
                 backdrop-blur-sm transition-all duration-300">
```

### FeaturedBanner Spec
```
Height: 55vh min (320px min, 600px max)
Aspect: fills viewport width
Gradient: linear-gradient(to top, #0A0A0F 0%, transparent 60%)
          + linear-gradient(to right, #0A0A0F 30%, transparent 70%) [RTL]

Content overlay (bottom-right in RTL):
  - Genre pills: [אקשן] [מותחן]
  - Title: text-display font-rubik
  - Synopsis: max 2 lines, text-secondary
  - Buttons: [▶ צפה עכשיו] [+ הוסף לרשימה]
  - Rating: ⭐ 8.2 | שנה | משך

Auto-rotate: every 8s with crossfade transition
Dots indicator: bottom-center
```

### "המשך צפייה" Row
```
Card size: w-48 md:w-56 flex-shrink-0
Thumbnail: 16:9 ratio with rounded-lg overflow-hidden
Progress bar: absolute bottom-0 h-1 bg-primary (e.g., 60% watched)
Hover: scale-105 + show overlay with ▶ resume button
```

---

## 2. 📺 טלוויזיה חיה (Live TV)

### Layout Structure
```
┌─────────────────────────────────┐
│  TopNav                         │
├─────────────────────────────────┤
│  Now Playing Hero (if channel   │
│  selected) — 16:9 player embed  │
│  + EPG strip below              │
├─────────────────────────────────┤
│  CategoryFilter tabs:           │
│  [הכל] [חדשות] [ספורט] [בידור]  │
│  [ילדים] [מוזיקה] [בינלאומי]    │
├─────────────────────────────────┤
│  ChannelGrid — responsive grid  │
│  [ChannelCard × N]              │
├─────────────────────────────────┤
│  BottomNav                      │
└─────────────────────────────────┘
```

### Channel Grid
```
Mobile:  2 columns
Tablet:  3–4 columns  
Desktop: 5–6 columns

Grid classes:
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4
              lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
```

### ChannelCard Spec
```
Size: aspect-video (16:9) or aspect-square for logo-only view
Background: bg-elevated rounded-xl overflow-hidden
Content:
  - Channel logo (centered, 48px)
  - Channel name (bottom, text-small)
  - "בשידור חי" badge (top-right, red dot + pulse)
  - Current program name (text-xs text-muted)
  - Favorite star icon (top-left, toggleable)
Hover: scale-105 + glow border rgba(37,99,235,0.4)
```

### EPG Timeline (when channel selected)
```
Strip height: 80px
Horizontal scroll, RTL
Time markers every 30min
Current time indicator: red vertical line
Program blocks: colored by category
Current program: highlighted with border-primary
```

### Category Filter Tabs
```
<div class="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
  <button class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
                 bg-white/5 hover:bg-white/10 border border-white/10
                 data-[active=true]:bg-primary data-[active=true]:border-primary
                 transition-all duration-200">
    ספורט
  </button>
</div>
```

---

## 3. 🎬 סרטים (Movies)

### Layout Structure
```
┌─────────────────────────────────┐
│  TopNav                         │
├─────────────────────────────────┤
│  Page Header: "סרטים"           │
│  SearchBar (inline)             │
├─────────────────────────────────┤
│  GenreFilterBar (horizontal)    │
│  [הכל] [אקשן] [דרמה] [קומדיה]  │
│  [אימה] [רומנטי] [תיעודי] [SF]  │
├─────────────────────────────────┤
│  SortBar: [חדש ביותר ▾] [פופולרי]│
├─────────────────────────────────┤
│  MoviePosterGrid                │
│  (2-col mobile → 4-col desktop) │
├─────────────────────────────────┤
│  LoadMore button / infinite scroll│
├─────────────────────────────────┤
│  BottomNav                      │
└─────────────────────────────────┘
```

### Movie Poster Grid
```
Grid:
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4
              lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">

MovieCard (poster mode): aspect-[2/3] w-full
```

### Movie Detail Modal
```
Trigger: click on any MovieCard
Type: full-screen slide-up on mobile / centered modal on desktop

Layout (RTL):
┌─────────────────────────────────┐
│  [✕ close]                      │
│  Backdrop image (top 40%)       │
│  Gradient fade                  │
├─────────────────────────────────┤
│  [Poster] | Title (Rubik bold)  │
│            | Year · Rating · HD  │
│            | Genre pills         │
│            | Synopsis (3 lines)  │
│            | [▶ צפה עכשיו]      │
│            | [⬇ הורד] [+ שמור]  │
├─────────────────────────────────┤
│  Cast row (horizontal scroll)   │
│  Similar movies row             │
└─────────────────────────────────┘

Classes:
  <div class="fixed inset-0 z-50 bg-bg-base/95 backdrop-blur-md
              overflow-y-auto animate-slide-up md:flex md:items-center">
```

---

## 4. 📺 סדרות (Series)

### Layout Structure
Same as סרטים but with series thumbnails (16:9).

### Series Detail Modal
```
Additional section below description:
┌─────────────────────────────────┐
│  עונה 1 ▾  [עונה 1] [עונה 2]   │
├─────────────────────────────────┤
│  Episode list:                  │
│  ┌──────────────────────────┐   │
│  │ [Thumb] פרק 1 — כותרת    │   │
│  │         25 דק' | תיאור    │   │
│  │         Progress: ████░░  │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │ [Thumb] פרק 2 — כותרת    │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘

EpisodeRow classes:
  <div class="flex gap-3 p-3 rounded-lg hover:bg-white/5
              cursor-pointer transition-colors duration-150">
    <div class="w-32 aspect-video flex-shrink-0 rounded-lg overflow-hidden">
      <img .../>
      {progressBar}
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-text-primary truncate">פרק 1</p>
      <p class="text-xs text-text-muted mt-1">25 דקות</p>
      <p class="text-xs text-text-secondary mt-1 line-clamp-2">תיאור הפרק...</p>
    </div>
  </div>
```

---

## 5. 🔍 חיפוש (Search)

### Layout Structure
```
┌─────────────────────────────────┐
│  TopNav                         │
├─────────────────────────────────┤
│  SearchBar (large, autofocus)   │
├─────────────────────────────────┤
│  [Empty state] OR:              │
│  ResultTabs: [הכל][ערוצים][סרטים][סדרות] │
├─────────────────────────────────┤
│  Results Grid (mixed content)   │
├─────────────────────────────────┤
│  BottomNav                      │
└─────────────────────────────────┘
```

### Empty State (before search)
```
Content:
  - 🔍 icon (large, text-muted)
  - "מה תרצה לצפות?" heading
  - Recent searches list (chips)
  - Trending searches

Classes:
  <div class="flex flex-col items-center justify-center min-h-[60vh]
              text-center px-8 gap-4">
```

### Search Results
```
Unified grid showing all types.
Each result has a type indicator badge:
  🔴 LIVE | 🎬 סרט | 📺 סדרה

Type filter tabs (sticky below search bar):
  <div class="sticky top-16 z-40 bg-bg-base/90 backdrop-blur-md
              border-b border-white/5 px-4 py-2">
```

### No Results State
```
Illustration + "לא מצאנו תוצאות עבור '...'"
Suggestions: "אולי התכוונת ל..."
```

---

## 6. ⚙️ הגדרות (Settings)

### Layout Structure
```
┌─────────────────────────────────┐
│  TopNav (back button added)     │
├─────────────────────────────────┤
│  User Profile Card              │
│  [Avatar] [שם] [חבילה פעילה]    │
├─────────────────────────────────┤
│  Settings Sections:             │
│                                 │
│  ▸ שידור ואיכות                 │
│    איכות וידאו: [אוטו ▾]        │
│    עצמת שמע: ████░ slider       │
│                                 │
│  ▸ שפה ונגישות                  │
│    שפת ממשק: [עברית ▾]          │
│    כתוביות: [כבוי ▾]            │
│    שפת שמע: [עברית ▾]           │
│                                 │
│  ▸ הודעות                        │
│    [toggle] שידורים חדשים       │
│    [toggle] תזכורות תוכניות     │
│                                 │
│  ▸ חשבון                        │
│    ניהול מנוי                    │
│    מכשירים מחוברים               │
│    יצוא נתונים                   │
│                                 │
│  ▸ אפליקציה                      │
│    גרסה: 1.0.0                   │
│    בדוק עדכונים                  │
│    מדיניות פרטיות                │
│    יצירת קשר                     │
├─────────────────────────────────┤
│  [כפתור התנתק] (destructive)    │
├─────────────────────────────────┤
│  BottomNav                      │
└─────────────────────────────────┘
```

### Settings Row Component
```tsx
// Reusable settings row
<div class="flex items-center justify-between px-4 py-4
            border-b border-white/5 hover:bg-white/3 transition-colors">
  <div class="flex items-center gap-3">
    <Icon class="w-5 h-5 text-text-muted" />
    <div>
      <p class="text-sm font-medium text-text-primary">תווית הגדרה</p>
      <p class="text-xs text-text-muted">תיאור קצר</p>
    </div>
  </div>
  <ChevronLeft class="w-4 h-4 text-text-muted" /> {/* RTL = left */}
</div>
```

### Quality Select
```
Options: אוטומטי | 4K Ultra HD | 1080p מלא | 720p | 480p | חיסכון בנתונים
Default: אוטומטי
```

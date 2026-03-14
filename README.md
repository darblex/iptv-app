# IL IPTV – Backend & Core (Phase 1)

Next.js 15 (App Router, TypeScript) + Tailwind CSS (RTL ready) + server-side Xtream Codes proxy.

## הגדרת סביבה

- ערכי ברירת מחדל ב-`.env.local`:
  - `IPTV_HOST=ilvip.net`
  - `IPTV_PORT=443`
  - `IPTV_USER=54-240-3299`
  - `IPTV_PASS=54-240-3299`
- איזון עומסים בין חשבונות (אופציונלי):
  - `IPTV_ACCOUNTS=[{"host":"ilvip.net","port":443,"username":"54-240-3299","password":"54-240-3299"}]`

## מסלולי API

- `GET /api/live` – קטגוריות וערוצי לייב
- `GET /api/vod` – קטגוריות וספריית VOD
- `GET /api/series` – קטגוריות וסדרות
- `GET /api/epg/[channelId]` – לוח שידורים לערוץ
- `GET /api/stream/[type]/[id]` – פרוקסי סטרים (Live/VOD/Series) ללא חשיפת פרטי התחברות

## פיתוח והרצה

```bash
npm install
npm run dev
# או הרצה בפרודקשן
npm run build && npm run start
```

## Deployment

- `Dockerfile` מוכן ל-Node 20 Alpine.
- `railway.json` עם ברירת מחדל ל-build (`npm run build`) ו-healthcheck על `/api/live`.

## RTL & שפות

- `layout.tsx` מוגדר `lang="he"` ו-`dir="rtl"`.
- דף הבית מינימלי (ללא UI צפייה) ומציג את המסלולים הזמינים.

## ספריות וסטאק

- Next.js 15 + TypeScript + Tailwind CSS 4
- HLS.js ו-`mpegts.js` הותקנו לצורך נגן בשלב הבא
- איזון עומסים בסיסי עם Health Checks ברמת השרת

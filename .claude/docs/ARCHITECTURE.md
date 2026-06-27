# ARCHITECTURE.md

> location: `.claude/docs/ARCHITECTURE.md`
> מטרה: לתעד איך המערכת בנויה, למה, ומה גבולות האחריות.
> מקור אמת לאפיון הכולל: `CLAUDE2.md`.

---

## 1. סקירת מערכת

אפליקציית web נייד-first (React + Vite) שמדברת **ישירות** מול Supabase
(PostgreSQL + Auth). אין שכבת API אמיתית: שרת ה-Express (`server/index.js`) הוא
כיום stub עם `GET /api/health` בלבד. כל הלוגיקה — כולל תמחור — רצה ב-client.

אחריות עיקרית:
- **client** — UI, ניתוב, state, גישה ל-DB, לוגיקת תמחור, הפקת הצעת מחיר.
- **Supabase** — אחסון נתונים, אימות (Auth), אכיפת גישה (RLS).
- **server** — כרגע health-check בלבד; שמור לעתיד (ולידציה/לוגיקה מאובטחת).

---

## 2. עקרונות ארכיטקטורה

- לוגיקת תמחור מרוכזת ב-`client/src/lib/pricing.js` — מקור אמת יחיד.
- קומפוננטות פונקציונליות קטנות עם hooks; state מקומי אלא אם נדרש שיתוף.
- גישה ל-DB ישירות דרך ה-Supabase client (אין repository layer כרגע).
- העדפת patterns קיימים על פני אבסטרקציות חדשות.
- RTL ו-Mobile-first כברירת מחדל.

---

## 3. רכיבים

| רכיב | אחריות | נתונים | תלויות |
|------|--------|--------|--------|
| `App.jsx` | ניתוב + ניהול session | session | Supabase Auth, react-router |
| `OrdersPage` | לוח הזמנות, חיפוש, פילטרים | `orders` | Supabase, OrderForm, OrderDrawer |
| `CustomersPage` | CRUD לקוחות + אתרים + היסטוריה | `customers`, `customer_sites`, `orders` | Supabase, OrderDrawer |
| `PriceListsPage` | CRUD מחירונים פר-מפעל | `factories`, `price_list_items`, `factory_concrete_params` | Supabase |
| `OrderForm` | יצירה/עריכה הזמנה + תמחור auto | `orders`, `order_items` | Supabase, `pricing.js` |
| `OrderDrawer` | תצוגה, סטטוס, מצב כספי, הצעת מחיר | `orders` | Supabase, `generateQuote.js` |
| `lib/pricing.js` | חישוב עלות בטון/משאבה + defaults | — | — |
| `lib/generateQuote.js` | בניית HTML והדפסת הצעת מחיר | — | — |
| `lib/supabase.js` | אתחול Supabase client | — | `@supabase/supabase-js` |

---

## 4. זרימת נתונים

### Flow: יצירת הזמנה
1. המשתמש ממלא `OrderForm`; הטופס טוען customers/factories/price_list_items/params.
2. שינוי מפעל/פרמטר/כמות → חישוב `unit_price_cost` אוטומטי (`pricing.js`).
3. שמירה → `insert` ל-`orders`, קבלת `id`, ואז `insert` ל-`order_items`.
4. בעריכה: `update` ל-`orders`, `delete` כל `order_items`, ואז `insert` מחדש.

**נקודות כשל:** כשל ברשת/RLS בשמירה. **טיפול:** try/catch + `alert` בעברית.

### Flow: תצוגת הזמנות
1. `OrdersPage` מחשב טווח (`getRange`) לפי תצוגה (יומי/שבועי/חודשי) ו-`anchor`.
2. שאילתה: `orders` עם join ל-`customers`, `factories`, `order_items`, מסונן לפי
   `scheduled_at` בטווח.
3. סינון client-side לפי חיפוש/סטטוס/מפעל.

---

## 5. גבולות API

### External API (Express) — כיום
| Method | Path | מטרה | Auth |
|--------|------|------|------|
| GET | `/api/health` | health-check | None |

אין endpoints נוספים. כל שאר ה"API" הוא קריאות ישירות מה-client ל-Supabase.

### גבולות פנימיים
- לוגיקת תמחור אך ורק ב-`pricing.js` (לא לשכפל בקומפוננטות).
- גישת DB דרך ה-Supabase client; כיום ללא שכבת abstraction נפרדת.

---

## 6. מודל ה-DB

Database: **PostgreSQL (Supabase)**.

| Entity | מטרה | שדות מפתח | קשרים |
|--------|------|-----------|-------|
| `factories` | מפעל | `name` | 1→N price_list_items, concrete_params |
| `price_list_items` | פריט מחירון | `product_type`, `base_price`, `extra_per_unit`, `pipe_*`, `min_cubic_meters`, `shortfall_fee_cost` | N→1 factory |
| `factory_concrete_params` | תוספות בטון | `param_type`, `param_value`, `price_addition` | N→1 factory |
| `customers` | לקוח | `name`, `company_name`, `vat_id`, `phone`, `type` | 1→N sites, orders |
| `customer_sites` | אתר בנייה | `site_name` | N→1 customer |
| `orders` | הזמנה | `scheduled_at`, `status`, `payment_method`, `original_scheduled_at` | N→1 customer/factory, 1→N items |
| `order_items` | פריט הזמנה | `product_type`, `quantity`, `unit_price_customer`, `unit_price_cost`, פרמטרי בטון/משאבה | N→1 order |

**Migrations:** `schema.sql` (בסיס) + `migration_concrete_params.sql` +
`migration_pump_pipe.sql` + `migration_pump_size_constraint.sql` +
`migration_mixer.sql`. מורצים ידנית ב-Supabase SQL editor. `cascade`/`set null`
מוגדרים ב-FKs.

---

## 7. אינטגרציות

| אינטגרציה | כיוון | מטרה | Auth |
|-----------|-------|------|------|
| Supabase Postgres | Outbound | אחסון/שליפת נתונים | anon key + RLS |
| Supabase Auth | Outbound | login/session | email+password |

אין אינטגרציות חיצוניות נוספות.

---

## 8. טיפול בשגיאות

- שמירות עטופות ב-try/catch עם `alert` בעברית למשתמש ו-`console.error` ללוג.
- מחיקות מאחורי `confirm()`.
- אין שכבת error model מרכזית (אפליקציית משתמש-יחיד פשוטה).

---

## 9. Observability

- אין logging/metrics/tracing מובנים. שגיאות נכתבות ל-console.
- אין endpoint audit. (לעתיד אם יתווסף server.)

---

## 10. אבטחה

- **Authentication:** Supabase Auth, login יחיד (email+password). `App.jsx` שומר
  session ומגן על נתיבים ב-`ProtectedRoute`.
- **Authorization:** RLS על כל הטבלאות עם policy יחידה
  `to authenticated using(true) with check(true)` — גישה מלאה לכל משתמש מאומת
  (מתאים למשתמש יחיד).
- **נתונים רגישים:** anon key חשוף ב-client (תקין עם RLS); service-role key רק
  בצד שרת ולעולם לא ב-client. אין לקרוא/לחשוף `.env`.

---

## 11. Deployment

- Runtime: Node.js (Vite dev/build ל-client; Express ל-server).
- סביבות: Local (כיום). Production עתידי (Supabase מנוהל).
- קונפיגורציה דרך env vars; `server/.env.example` מתוחזק.
- אין CI/CD מוגדר כרגע.

---

## 12. Trade-offs

| החלטה | תועלת | עלות | סיבה |
|-------|-------|------|------|
| Client ניגש ישירות ל-Supabase | פיתוח מהיר, פחות קוד | אין ולידציה צד-שרת | משתמש יחיד, אמון מלא |
| תמחור ב-client | פשטות, פידבק מיידי | לוגיקה חשופה | אין צורך באכיפה צד-שרת |
| Policy RLS גורפת | פשוט | לא מתאים לריבוי משתמשים | משתמש יחיד |

---

## 13. הרחבות עתידיות (לא לממש לפני צורך)

- שכבת API ב-Express עם ולידציה + service-role.
- בדיקות אוטומטיות.
- logging/observability.

לא לממש מראש: microservices, queues, caching, workers.

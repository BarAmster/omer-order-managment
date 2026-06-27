# CLAUDE2.md — אפיון מלא

> קובץ זה הוא **מקור האמת** לאפיון האפליקציה. הוא מחליף את `CLAUDE.md` הישן.
> נכתב בעברית עם מונחים טכניים (קוד, טבלאות, שדות, פקודות) באנגלית.
> נכתב בעברית עם מונחים טכניים (קוד, טבלאות, שדות, פקודות) באנגלית.
> מסמכים מפורטים נוספים: `.claude/docs/PRD.md`, `.claude/docs/ARCHITECTURE.md`,
> `.claude/docs/PROGRESS.md`, `.claude/docs/DECISIONS.md`.

---

## 1. מטרת האפליקציה

אפליקציית ניהול הזמנות ולקוחות לעסק של אספקת בטון (העסק של עומר). מטרתה להחליף
ניהול ידני (טלפון/וואטסאפ/דפים) במערכת אחת, מהירה ונוחה לנייד, שמרכזת:

1. **הזמנות** — מי הזמין, מה (בטון/משאבה/מוצרים נלווים), מאיזה מפעל, מתי, לאיזה אתר,
   באיזה סטטוס, ובאיזה מחיר.
2. **לקוחות** — פרופיל לקוח קבוע עם אתרי בנייה והיסטוריית הזמנות.
3. **מחירונים** — מחיר בסיס ותוספות לכל מפעל, ממנו נגזרת אוטומטית **עלות** ההזמנה.
4. **רווחיות** — לכל הזמנה: מחיר ללקוח מול עלות מהמפעל ⟵ רווח לפריט ולסה"כ.
5. **הצעת מחיר** — הפקת מסמך הצעת מחיר מודפס/PDF מתוך הזמנה.

**הערך המרכזי:** הבעלים רואה במבט אחד את לוח ההזמנות (יומי/שבועי/חודשי), יוצר
הזמנה חדשה בכמה הקלקות עם תמחור אוטומטי, ויודע בכל רגע מה הרווח על כל עבודה.

**משתמש יחיד:** הבעלים/אדמין בלבד. אין לקוחות-קצה, אין הרשאות מרובות, אין שיתוף.

---

## 2. Tech Stack

| שכבה        | טכנולוגיה |
|-------------|-----------|
| Frontend    | React 19 + Vite, Tailwind CSS v4, `react-router-dom` v7, `lucide-react` (icons) |
| Backend     | Node.js + Express 5 — **כיום stub בלבד** (ראו §4) |
| Database    | Supabase (PostgreSQL) |
| Auth        | Supabase Auth — login יחיד עם email+password |
| Data access | ה-client מדבר **ישירות** מול Supabase דרך `@supabase/supabase-js` (anon key) |

שפת ממשק: **עברית, RTL** לכל אורך האפליקציה. Mobile-first (יעד עיקרי ~430px רוחב).

---

## 3. פקודות פיתוח

```bash
# התקנה
cd client && npm install
cd server && npm install

# הרצת frontend + backend יחד (מהשורש)
npm run dev

# כל אחד בנפרד
npm run dev:client     # vite, http://localhost:5173
npm run dev:server     # nodemon, http://localhost:3001

# build + lint (client)
cd client && npm run build
cd client && npm run lint
```

**אין כיום בדיקות (tests).** אין typecheck (הפרויקט JS, לא TS).

### משתני סביבה

- **client** (`client/.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **server** (`server/.env`): `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (ראו `server/.env.example`)

לעולם לא לקרוא/להדפיס/לעשות commit לקבצי `.env`.

---

## 4. ארכיטקטורה

```
/client       React + Vite frontend  ← כל הלוגיקה כאן
/server       Express API            ← כרגע רק GET /api/health
/supabase     schema.sql + migrations + seed
/.claude/docs PRD / ARCHITECTURE / PROGRESS / DECISIONS
```

**עובדה חשובה:** ה-frontend ניגש **ישירות** ל-Supabase מכל עמוד/קומפוננטה
(`supabase.from('...').select/insert/update/delete`). השרת (`server/index.js`) הוא
כרגע **stub** ובו endpoint יחיד `GET /api/health`. אין שכבת API אמיתית, אין
ולידציית קלט בצד שרת, ואין business logic בצד שרת. כל הלוגיקה (כולל תמחור) רצה
ב-client תחת `client/src/lib/`.

### מבנה ה-Frontend

```
client/src/
  App.jsx                 ניתוב + ניהול session (Supabase Auth)
  main.jsx
  lib/
    supabase.js           אתחול ה-Supabase client
    pricing.js            לוגיקת תמחור (בטון + משאבה) + ברירות מחדל לפרמטרים
    generateQuote.js      הפקת הצעת מחיר (HTML → חלון הדפסה)
  components/
    MainLayout.jsx        layout עם bottom-tab navigation (3 טאבים)
    OrderForm.jsx         טופס יצירה/עריכה של הזמנה (drawer תחתון)
    OrderDrawer.jsx       תצוגת הזמנה + שינוי סטטוס + מצב כספי + הצעת מחיר
  pages/
    LoginPage.jsx         מסך כניסה
    OrdersPage.jsx        עמוד ראשי — לוח הזמנות יומי/שבועי/חודשי
    CustomersPage.jsx     רשימת לקוחות + פרטים + היסטוריה
    PriceListsPage.jsx    מחירונים לפי מפעל
```

### ניתוב (`App.jsx`)

- `App` מנהל `session` דרך `supabase.auth.getSession()` + `onAuthStateChange`.
- `/login` — `LoginPage` (מפנה ל-`/` אם מחובר).
- `/` — `MainLayout` (מוגן ב-`ProtectedRoute`) עם תתי-נתיבים:
  - `index` → `OrdersPage`
  - `customers` → `CustomersPage`
  - `pricelists` → `PriceListsPage`

---

## 5. מודל הדומיין

### 5.1 לקוחות (`customers` + `customer_sites`)

- לקוח **קבוע** בלבד (`type = 'regular'`). שדה `type` תומך גם ב-`'new'` אך בפועל
  כל הלקוחות נשמרים כ-`regular`.
- שדות: `name` (חובה), `company_name`, `vat_id` (ח.פ/ת.ז/ע.מ), `phone`.
- לכל לקוח רשימת **אתרי בנייה** (`customer_sites.site_name`). בעריכת לקוח, האתרים
  נמחקים ומוכנסים מחדש (replace-all).
- בעמוד הלקוח: פרטים + תגיות אתרים + **היסטוריית 20 ההזמנות האחרונות** (read-only
  דרך `OrderDrawer` עם `readOnly`).

### 5.2 מפעלים ומחירונים (`factories`, `price_list_items`, `factory_concrete_params`)

לכל מפעל (`factories.name`) מחירון משלו:

- **בטון** — שורת `price_list_items` אחת מסוג `concrete` עם `base_price` = מחיר
  לקוב של בטון סטנדרטי (ב20 + עדש + שקיעה 5).
- **תוספות בטון** — `factory_concrete_params`: תוספת ₪ לקוב לכל ערך פרמטר, **ניתנות
  לעריכה לכל מפעל**. סוגי פרמטרים: `strength`, `concrete_type`, `slump`.
- **משאבות** — שורות `price_list_items` מסוג `pump`: `base_price` (לראשונים 10 קוב),
  `extra_per_unit` (לכל קוב מעל 10), ואופציונלית `pipe_included_meters` +
  `pipe_extra_per_meter` (לצינור, רלוונטי למשאבת מייקו וכד').
- **מוצרים נלווים** — שורות `price_list_items` מסוג `accessory`: `product_name` +
  `base_price` ליחידה.
- **מיקסר** — שורת `price_list_items` אחת מסוג `mixer`: `base_price` (עלות בסיס),
  `min_cubic_meters` (רף הזמנה מינימלי בקוב בטון), `shortfall_fee_cost` (דמי השלמה
  לקוב, נגבה מהמפעל לכל קוב מתחת לרף). הרף ודמי ההשלמה ניתנים לעריכה לכל מפעל.

**יצירת מפעל חדש** מאתחלת אוטומטית: שורת בטון (`base_price=0`), 4 משאבות ברירת מחדל
(36מ/42מ/52מ/מייקו), שורת מיקסר ברירת מחדל (`base_price=0`, `min_cubic_meters=8`,
`shortfall_fee_cost=0`), וכל פרמטרי הבטון מתוך `DEFAULT_CONCRETE_PARAMS`.

### 5.3 הזמנות (`orders` + `order_items`)

**שדות הזמנה:** `customer_id`, `factory_id`, `location` (אתר), `scheduled_at`,
`original_scheduled_at` (אם נדחתה), `status`, `payment_method`, `notes`.
(`customer_name` קיים בסכמה ללקוח חד-פעמי, אך ה-UI הנוכחי דורש לקוח קבוע.)

**סטטוסים:** `ממתין` | `סגור` | `בוטל` | `נדחה`.
- דחייה: בוחרים תאריך חדש; `original_scheduled_at` נשמר עם המועד המקורי
  ו-`scheduled_at` מתעדכן למועד החדש. ב-UI מוצג "נדחה מ-<תאריך מקורי>".

**אמצעי תשלום:** `צק` | `העברה` | `העברה בנקאית` (אופציונלי).

**פריטי הזמנה (`order_items`)** — ארבעה סוגים (`product_type`):

1. **`concrete` (בטון)**
   - פרמטרים: `strength` (`b20`/`b30`/`b40`/`b50`/`b60`), `concrete_type`
     (`adash`/`maico`/`dachus`), `slump` (`4`/`5`/`6`/`7`).
   - `quantity` בקוב; ניתן "כמות פתוחה" (`is_open_quantity` → מוצג כ-`16+`).
   - `unit_price_customer` = מחיר מוסכם לקוב; `unit_price_cost` = עלות לקוב (auto).
   - סה"כ פריט = `quantity × unit_price`.

2. **`pump` (משאבה)** — תמחור **per-job**, לא per-unit:
   - כמות המשאבה **תמיד שווה לכמות הבטון** בהזמנה (מסונכרן אוטומטית).
   - `unit_price_customer` / `unit_price_cost` מאחסנים את **מחיר העבודה הכולל**
     (לא מחיר ליחידה). לכן בחישוב סה"כ ורווח, פריט pump לא מוכפל ב-`quantity`.
   - `pipe_meters` — מטרי צינור בפועל (ברירת מחדל = `pipe_included_meters`).

3. **`accessory` (מוצר נלווה)** — `product_name` נבחר מהמחירון; `quantity × unit_price`.

4. **`mixer` (מיקסר)** — תמחור **per-job**, לא per-unit, כמו `pump`:
   - כמות המיקסר **תמיד שווה לכמות הבטון** בהזמנה (מסונכרן אוטומטית).
   - `unit_price_cost` מחושב אוטומטית: `base_price` + (קוב חסר מתחת לרף) ×
     `shortfall_fee_cost` של המיקסר במחירון המפעל. ניתן לעריכה ידנית (override).
   - `unit_price_customer` **תמיד ידני** — אין חישוב אוטומטי, ואין שדה "מחיר לקוח"
     או "דמי השלמה ללקוח" במחירון; המשתמש קובע לפי ראות עיניו בכל הזמנה.
   - בחישוב סה"כ ורווח, פריט mixer לא מוכפל ב-`quantity` (כמו pump).

---

## 6. לוגיקת התמחור (`client/src/lib/pricing.js`)

### בטון
```
unit_price_cost = base_price
               + strength_add + concrete_type_add + slump_add
```
התוספות נלקחות מ-`factory_concrete_params` של המפעל הנבחר
(`calcConcretePrice(basePrice, strength, concreteType, slump, factoryParams)`).
ברירות מחדל (ניתנות לעריכה): חוזק ב20/+0, ב30/+10, ב40/+20, ב50/+30, ב60/+40 ·
סוג עדש/+0, מייקו/+30, דחוס/+40 · שקיעה 4/−10, 5/+0, 6/+10, 7/+20.

### משאבה
```
extra_cubic = max(0, cubic_meters − 10)
total       = base_price + extra_cubic × extra_per_unit
              + (אם יש צינור) max(0, used_pipe − pipe_included) × pipe_extra_per_meter
```
(`calcPumpPrice(pumpItem, cubicMeters, pipeMeters)`). `cubic_meters` = כמות הבטון.

### מיקסר
```
shortfall = max(0, min_cubic_meters − cubic_meters)
unit_price_cost = base_price + shortfall × shortfall_fee_cost
```
(`calcMixerCost(mixerItem, cubicMeters)`). `cubic_meters` = כמות הבטון. אם הכמות
מעל הרף, `shortfall = 0` ואין תוספת.

### התנהגות auto בטופס (`OrderForm.jsx`)
- `unit_price_cost` מחושב **אוטומטית** משינוי מפעל / פרמטרי בטון / כמות (גם למיקסר).
- אם המשתמש **עורך ידנית** את `unit_price_cost`, החישוב האוטומטי לא דורס אותו.
- שינוי כמות הבטון מסנכרן את כמות+עלות כל המשאבות והמיקסרים בהזמנה.
- `unit_price_customer` (מחיר ללקוח) תמיד ידני.

---

## 7. סכמת ה-DB (`supabase/schema.sql` + migrations)

| טבלה | תיאור / שדות עיקריים |
|------|----------------------|
| `factories` | `name` |
| `price_list_items` | `factory_id`, `product_type` (`concrete`/`pump`/`accessory`/`mixer`), `product_name`, `base_price`, `extra_per_unit`, `pipe_included_meters`, `pipe_extra_per_meter`, `min_cubic_meters`, `shortfall_fee_cost` |
| `factory_concrete_params` | `factory_id`, `param_type` (`strength`/`concrete_type`/`slump`), `param_value`, `price_addition` · unique(factory, type, value) |
| `customers` | `name`, `company_name`, `vat_id`, `phone`, `type` (`new`/`regular`) |
| `customer_sites` | `customer_id`, `site_name` |
| `orders` | `customer_id`, `customer_name`, `factory_id`, `location`, `scheduled_at`, `original_scheduled_at`, `status`, `payment_method`, `notes` |
| `order_items` | `order_id`, `product_type`, `product_name`, `quantity`, `is_open_quantity`, `unit_price_customer`, `unit_price_cost`, `strength`, `concrete_type`, `slump`, `pump_size`, `pipe_meters` |

**Migrations** (להריץ ב-Supabase SQL editor, בנוסף ל-`schema.sql`):
`migration_concrete_params.sql`, `migration_pump_pipe.sql`,
`migration_pump_size_constraint.sql`, `migration_mixer.sql`. seed: `seed_customers.sql`.

### RLS / אבטחה
- RLS מופעל על כל הטבלאות.
- Policy יחידה לכל טבלה: `"auth full access" ... to authenticated using(true) with check(true)`
  — כלומר **כל משתמש מאומת** מקבל גישה מלאה (מתאים לאפליקציית משתמש-יחיד).
- מאחר שה-client משתמש ב-anon key, האבטחה נשענת כולה על Auth + RLS.

---

## 8. זרימות משתמש עיקריות

### יצירת הזמנה
1. FAB (+) בעמוד ההזמנות → `OrderForm` (drawer תחתון).
2. חיפוש לקוח (autocomplete לפי שם/חברה) → בחירה.
3. בחירת אתר (select מתוך אתרי הלקוח, או טקסט חופשי אם אין).
4. בחירת מפעל (ברירת מחדל = הראשון), תאריך+שעה, אמצעי תשלום.
5. הוספת פריטים (בטון/משאבה/נלווה) — עלות מתחשבת אוטומטית, מחיר ללקוח ידני.
6. שמירה → insert ל-`orders` ואז insert ל-`order_items`.
   בעריכה: update ל-`orders`, מחיקת כל `order_items` והכנסה מחדש.

### צפייה/ניהול הזמנה (`OrderDrawer`)
- פרטים, פירוט פריטים, סה"כ ללקוח.
- "מצב כספי" (מקופל) — רווח לפריט ורווח כולל (מחיר ללקוח − עלות).
- שינוי סטטוס (כולל דחייה לתאריך), הצעת מחיר, עריכה, מחיקה.

### הצעת מחיר (`generateQuote.js`)
- בונה HTML בעברית RTL (לוגו מ-`/logo.jpeg`, פרטי לקוח, טבלת פריטים, סה"כ לפני מע"מ,
  שורות חתימה), פותח חלון חדש ומפעיל `window.print()`.

### תצוגת הזמנות (`OrdersPage`)
- מתגי תצוגה: יומי / שבועי (ראשון–שבת) / חודשי, עם ניווט קדימה/אחורה.
- חיפוש (שם לקוח / אתר / מפעל), פילטר סטטוס, פילטר מפעל (אם >1 מפעל).
- שאילתה לפי טווח `scheduled_at`.

---

## 9. מוסכמות UI

- RTL לכל אורך (`dir="rtl"`), Mobile-first (max ~430–512px).
- Bottom-tab navigation (3 טאבים: הזמנות / לקוחות / מחירונים).
- FAB (+) ליצירת הזמנה.
- הזמנות/טפסים נפתחים ב-**drawer תחתון** (`rounded-t-3xl`, overlay `bg-black/40`),
  לא בעמוד נפרד.
- פרטים כספיים מקופלים כברירת מחדל.
- צבעי סטטוס: ממתין=צהוב, סגור=ירוק, בוטל=אדום, נדחה=אפור.
- צבע פעולה ראשי: `blue-600`.

---

## 10. איך Claude אמור לעבוד ברפו הזה

1. **קרא קודם** את הקבצים הרלוונטיים: `CLAUDE2.md`, `.claude/docs/*`, וקוד המקור הרלוונטי.
2. לכל שינוי לא-טריוויאלי — הצג תוכנית קצרה לפני עריכה.
3. שמור על שינויים קטנים וממוקדים; העדף הרחבת patterns קיימים על פני אבסטרקציות חדשות.
4. **התאם לסגנון הקיים**: עברית RTL, Tailwind, גישה ישירה ל-Supabase, קומפוננטות
   פונקציונליות עם hooks, drawer-ים תחתונים.
5. אל תכניס תלויות חדשות, אל תשנה סכמת DB/Auth/RLS, ואל תזיז לוגיקה לצד שרת — ללא
   אישור מפורש מראש (ראו §11).
6. אל תעשה commit/push אלא אם התבקשת. ענף ייעודי לכל feature/fix.
7. אל תיגע ב-`.env`, secrets, או service-role keys.
8. עדכן את `.claude/docs/PROGRESS.md` בסוף עבודה משמעותית.
9. אל תכריז על "הושלם" בלי שהרצת build/lint בפועל (או שתציין במפורש שלא הורצו ולמה).

---

## 11. מתי לשאול לפני ביצוע

- שינוי סכמת DB / migration.
- שינוי Auth / RLS / אבטחה.
- שינוי לוגיקת תמחור (`pricing.js`) — משפיע ישירות על כסף.
- מעבר מלוגיקה ב-client ל-server (API חדש).
- תלות חדשה / שירות חיצוני חדש.
- refactor גדול / שינוי ארכיטקטורה.
- כל פעולה הרסנית או החלטה מוצרית עמומה.

---

## 12. מצב נוכחי ו-Roadmap

**שלב:** MVP פעיל (כל שלושת העמודים עובדים, תמחור והצעת מחיר עובדים).

**רעיונות עתידיים (לא לממש לפני בקשה):**
- העברת לוגיקה/ולידציה לצד שרת (כיום השרת stub).
- בדיקות אוטומטיות (אין כיום).
- שליחת הצעת מחיר ישירות (וואטסאפ/מייל) במקום הדפסה בלבד.
- דוחות/סיכומי רווחיות לתקופה בעמוד הראשי.
- ייצוא נתונים, גיבוי.

> שאלות פתוחות מתועדות ב-`.claude/docs/PROGRESS.md` ו-`.claude/docs/PRD.md`.

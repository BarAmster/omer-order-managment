# פיצ'ר: הוספת לקוח חדש מתוך כרטיס ההזמנה

## מטרה
כאשר יוצרים הזמנה ומקלידים שם של לקוח שאינו קיים ברשימת הלקוחות, לאפשר הוספה
מהירה של הלקוח ישירות מתוך טופס ההזמנה — בלי לעבור לעמוד "לקוחות" ולחזור.

## החלטות מוצר (סוכמו מול המשתמש)
1. **שדות בטופס ההוספה**: טופס מלא — שם, חברה, ח.פ/ת.ז, טלפון, ורשימת אתרי בניה
   (זהה לטופס בעמוד הלקוחות).
2. **נקודת כניסה**: כפתור **"+ הוסף לקוח חדש"** בתוך תוצאות החיפוש של בורר הלקוח
   בטופס ההזמנה. השם שהוקלד בחיפוש יוזרק אוטומטית כשם הלקוח ההתחלתי.
3. **שמירה**: הלקוח נשמר ל-DB **מיד** עם אישור הטופס ("הוסף") — מופיע מיד בעמוד
   לקוחות גם אם נוטשים את ההזמנה.

## מצב קיים (קוד רלוונטי)
- בורר הלקוח (autocomplete) ב-[OrderForm.jsx:232-281](../client/src/components/OrderForm.jsx#L232-L281).
  כיום כשאין התאמה מוצג טקסט "לא נמצאו לקוחות" ב-[OrderForm.jsx:255-259](../client/src/components/OrderForm.jsx#L255-L259).
- טעינת לקוחות לטופס ב-[OrderForm.jsx:70-85](../client/src/components/OrderForm.jsx#L70-L85)
  (`customers` state, כולל `customer_sites(site_name)`).
- בורר המיקום/אתר תלוי ב-`selectedCustomer?.customer_sites` ב-[OrderForm.jsx:216](../client/src/components/OrderForm.jsx#L216)
  ו-[OrderForm.jsx:284-305](../client/src/components/OrderForm.jsx#L284-L305).
- טופס הלקוח הקיים: `CustomerModal` ב-[CustomersPage.jsx:274-361](../client/src/pages/CustomersPage.jsx#L274-L361)
  — כרגע פונקציה מקומית בתוך הקובץ.
- לוגיקת שמירת לקוח: `saveCustomer` ב-[CustomersPage.jsx:25-45](../client/src/pages/CustomersPage.jsx#L25-L45)
  (insert ל-`customers` + insert ל-`customer_sites`).

## דרישה נוספת — חיפוש על רשימה מלאה בבורר הלקוח
כיום ה-dropdown נפתח **רק** כשיש טקסט בחיפוש
([OrderForm.jsx:249](../client/src/components/OrderForm.jsx#L249) — `customerDropdownOpen && customerSearch`),
לכן בלחיצה על שדה ריק לא מוצגת שום רשימה ואי אפשר "לעיין".

**רצוי**: בלחיצה/פוקוס על השדה תוצג רשימת **כל הלקוחות**, וההקלדה מסננת אותה.

שינוי ב-[OrderForm.jsx:249-280](../client/src/components/OrderForm.jsx#L249-L280):
- תנאי הפתיחה הופך ל-`customerDropdownOpen` בלבד (בלי דרישת `customerSearch`).
- חישוב ההתאמות:
  ```js
  const q = customerSearch.trim().toLowerCase()
  const matches = q
    ? customers.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.company_name || '').toLowerCase().includes(q))
    : customers
  ```
- ה-dropdown כבר גלילתי (`max-h-52 overflow-y-auto` ב-[OrderForm.jsx:261](../client/src/components/OrderForm.jsx#L261)) — נשאר.
- כפתור **"+ הוסף לקוח חדש"** (משלב 3 למטה) יוצג תמיד בתחתית ה-dropdown, גם
  כשהרשימה מלאה וגם כשאין התאמות, כך שאין צורך לגלול עד הסוף כדי להגיע אליו —
  לשקול להצמיד אותו (`sticky bottom-0`) לתחתית אזור הגלילה.
- שיקול UX: אם רשימת הלקוחות גדולה מאוד, אפשר להגביל הצגה ל-N ראשונים כשאין
  טקסט חיפוש; כרגע מספר הלקוחות קטן ולכן לא נדרש.

## תוכנית מימוש

### שלב 1 — חילוץ `CustomerModal` לרכיב משותף
כדי לעשות שימוש חוזר בלי שכפול קוד:
- קובץ חדש `client/src/components/CustomerModal.jsx` המכיל את `CustomerModal` ואת
  ה-helper `Field` (מועברים מ-[CustomersPage.jsx:274-376](../client/src/pages/CustomersPage.jsx#L274-L376)).
- ה-API של הרכיב נשאר זהה: `props = { initial, onSave, onClose }`.
  `onSave` מקבל `{ id, name, company_name, vat_id, phone, sites }`.
- עדכון `CustomersPage.jsx` לייבא את הרכיב מהקובץ החדש (במקום ההגדרה המקומית).
- בדיקה שעמוד הלקוחות ממשיך לעבוד כרגיל (אין שינוי התנהגות).

### שלב 2 — פונקציית שמירת לקוח שמחזירה את הלקוח שנוצר
לוגיקת ה-insert ב-`CustomersPage.saveCustomer` משולבת עם `setModal`/`fetchCustomers`
ולא מחזירה את האובייקט. עבור ההזמנה צריך את הלקוח שנוצר (כולל `id` ו-`customer_sites`)
כדי לבחור אותו מיד.

נוסיף helper משותף (ב-`OrderForm` או בקובץ עזר קטן `client/src/lib/customers.js`):
```js
async function createCustomer({ name, company_name, vat_id, phone, sites }) {
  const { data, error } = await supabase
    .from('customers')
    .insert({ name, company_name, vat_id, phone, type: 'regular' })
    .select('id, name, company_name, customer_sites(site_name)')
    .single()
  if (error) throw error
  if (sites?.length) {
    await supabase.from('customer_sites')
      .insert(sites.map(s => ({ customer_id: data.id, site_name: s })))
  }
  // הרכבת האובייקט בפורמט שבו OrderForm מחזיק לקוחות
  return { ...data, customer_sites: sites.map(s => ({ site_name: s })) }
}
```
הערה: ה-`select` הראשוני לא יחזיר את האתרים שעדיין לא נוספו, לכן מרכיבים את
`customer_sites` ידנית מתוך `sites` שנשלחו.

### שלב 3 — הוספת כפתור "+ הוסף לקוח חדש" בבורר הלקוח
ב-[OrderForm.jsx:249-280](../client/src/components/OrderForm.jsx#L249-L280) (בלוק ה-dropdown):
- בתוצאות החיפוש, מתחת לרשימת ההתאמות (וגם במצב "לא נמצאו לקוחות"), להוסיף כפתור
  קבוע **"+ הוסף לקוח חדש"**.
- בלחיצה (`onMouseDown` כדי להקדים את ה-`onBlur` של ה-input):
  - לסגור את ה-dropdown.
  - לפתוח את `CustomerModal` עם `initial={{ name: customerSearch }}` (הזרקת השם
    שהוקלד). יידרש להרחיב מעט את `CustomerModal` כך שיקבל `initial.name` כברירת מחדל
    לשדה השם — כבר נתמך דרך `initial?.name` ב-[CustomersPage.jsx:275](../client/src/pages/CustomersPage.jsx#L275).
- state חדש ב-`OrderForm`: `const [showCustomerModal, setShowCustomerModal] = useState(false)`.

### שלב 4 — חיווט שמירת הלקוח החדש בטופס ההזמנה
ב-`OrderForm`, רינדור מותנה של `CustomerModal`:
```jsx
{showCustomerModal && (
  <CustomerModal
    initial={{ name: customerSearch }}
    onClose={() => setShowCustomerModal(false)}
    onSave={async (form) => {
      const created = await createCustomer(form)
      setCustomers(prev => [...prev, created].sort((a,b) => a.name.localeCompare(b.name, 'he')))
      setCustomerId(created.id)
      setCustomerSearch(created.name + (created.company_name ? ` — ${created.company_name}` : ''))
      setLocation('')          // בורר האתר יתמלא מ-customer_sites של הלקוח החדש
      setShowCustomerModal(false)
    }}
  />
)}
```
תוצאה: אחרי השמירה הלקוח נבחר אוטומטית, ובורר המיקום/אתר
([OrderForm.jsx:284-305](../client/src/components/OrderForm.jsx#L284-L305)) מציג את האתרים
שהוזנו (אם הוזנו), אחרת נופל ל-input חופשי כפי שקיים היום.

### שלב 5 — שכבות (z-index) ופוקוס
- שני המודלים (`OrderForm` ו-`CustomerModal`) משתמשים ב-`z-50`. כיוון
  ש-`CustomerModal` מרונדר אחרי/בתוך עץ ה-`OrderForm` הוא יופיע מעליו תקין;
  אם תיווצר בעיית ערבוב לחיצות (`onClick` של הרקע שמגלגל ל-`onClose` של ההזמנה),
  לוודא `stopPropagation` — כבר קיים ב-`CustomerModal` על ה-content. לשקול `z-[60]`
  למודל הלקוח ליתר ביטחון.

## נקודות לבדיקה (QA)
- לחיצה על שדה לקוח ריק → מוצגת רשימת כל הלקוחות; הקלדה מסננת אותה.
- כפתור "+ הוסף לקוח חדש" נגיש בלי גלילה עד הסוף (sticky בתחתית).
- הקלדת שם לא קיים → הופעת כפתור "הוסף לקוח חדש" → פתיחת מודל עם השם מוזרק.
- שמירת לקוח עם אתר אחד ויותר → בחירה אוטומטית + בורר אתר מתמלא.
- שמירת לקוח בלי אתרים → input מיקום חופשי מופיע.
- נטישת ההזמנה אחרי הוספת לקוח → הלקוח קיים בעמוד "לקוחות".
- עמוד "לקוחות" עדיין עובד אחרי חילוץ `CustomerModal` (הוספה/עריכה/מחיקה).
- שם כפול / שם ריק → ולידציה (כפתור "הוסף" מושבת כשאין שם — קיים היום).

## קבצים מושפעים
- **חדש**: `client/src/components/CustomerModal.jsx`
- **חדש (אופ')**: `client/src/lib/customers.js` (helper `createCustomer`)
- **עריכה**: `client/src/components/OrderForm.jsx`
- **עריכה**: `client/src/pages/CustomersPage.jsx` (ייבוא במקום הגדרה מקומית)

## מחוץ לסקופ (לא בפיצ'ר הזה)
- עריכת לקוח קיים מתוך ההזמנה.
- מחיקת לקוח מתוך ההזמנה.
- מיזוג/זיהוי כפילויות לקוחות אוטומטי.

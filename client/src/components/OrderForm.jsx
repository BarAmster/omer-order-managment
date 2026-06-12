import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { calcConcretePrice, calcPumpPrice } from '../lib/pricing'
import { X, Plus, Trash2 } from 'lucide-react'

const STRENGTH_OPTIONS = [
  { value: 'b20', label: 'ב20' },
  { value: 'b30', label: 'ב30' },
  { value: 'b40', label: 'ב40' },
  { value: 'b50', label: 'ב50' },
  { value: 'b60', label: 'ב60' },
]
const TYPE_OPTIONS = [
  { value: 'adash', label: 'עדש' },
  { value: 'maico', label: 'מייקו' },
  { value: 'dachus', label: 'דחוס' },
]
const SLUMP_OPTIONS = [
  { value: '4', label: 'שקיעה 4' },
  { value: '5', label: 'שקיעה 5' },
  { value: '6', label: 'שקיעה 6' },
  { value: '7', label: 'שקיעה 7' },
]
const PUMP_SIZES = [
  { value: '36', label: '36מ' },
  { value: '42', label: '42מ' },
  { value: '52', label: '52מ' },
  { value: 'maico', label: 'מייקו' },
]

function newConcreteItem() {
  return { _id: Math.random(), product_type: 'concrete', strength: 'b20', concrete_type: 'adash', slump: '5', quantity: '', is_open_quantity: false, unit_price_customer: '', unit_price_cost: '' }
}
function newPumpItem() {
  return { _id: Math.random(), product_type: 'pump', pump_size: '', quantity: '', is_open_quantity: false, pipe_meters: null, unit_price_customer: '', unit_price_cost: '' }
}
function newAccessoryItem() {
  return { _id: Math.random(), product_type: 'accessory', product_name: '', quantity: '', is_open_quantity: false, unit_price_customer: '', unit_price_cost: '' }
}

export default function OrderForm({ initial, onClose, onSaved }) {
  const [customers, setCustomers] = useState([])
  const [factories, setFactories] = useState([])
  const [priceItems, setPriceItems] = useState([])
  const [concreteParams, setConcreteParams] = useState([])

  const [customerId, setCustomerId] = useState(initial?.customers?.id || '')
  const [factoryId, setFactoryId] = useState(initial?.factories?.id || '')
  const [location, setLocation] = useState(initial?.location || '')
  const [scheduledAt, setScheduledAt] = useState(
    initial?.scheduled_at ? initial.scheduled_at.slice(0,16) : ''
  )
  const [paymentMethod, setPaymentMethod] = useState(initial?.payment_method || '')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [items, setItems] = useState(() => {
    if (initial?.order_items?.length) {
      return initial.order_items.map(i => ({ ...i, _id: Math.random() }))
    }
    return [newConcreteItem()]
  })
  const [saving, setSaving] = useState(false)

  const selectedCustomer = customers.find(c => c.id === customerId)
  const selectedFactory = factories.find(f => f.id === factoryId)
  const concreteBaseItem = priceItems.find(i => i.product_type === 'concrete' && i.factory_id === factoryId)

  useEffect(() => {
    async function load() {
      const [{ data: custs }, { data: facs }, { data: pitems }, { data: cparams }] = await Promise.all([
        supabase.from('customers').select('id, name, company_name, customer_sites(site_name)').order('name'),
        supabase.from('factories').select('id, name').order('created_at'),
        supabase.from('price_list_items').select('*'),
        supabase.from('factory_concrete_params').select('*'),
      ])
      setCustomers(custs || [])
      setFactories(facs || [])
      setPriceItems(pitems || [])
      setConcreteParams(cparams || [])
      if (!initial && facs?.length && !factoryId) setFactoryId(facs[0].id)
    }
    load()
  }, [])

  // Auto-fill cost prices when factory changes
  useEffect(() => {
    if (!factoryId) return
    setItems(prev => prev.map(item => {
      if (item.product_type === 'concrete') {
        const base = priceItems.find(p => p.product_type === 'concrete' && p.factory_id === factoryId)
        const params = concreteParams.filter(p => p.factory_id === factoryId)
        if (base) {
          const cost = calcConcretePrice(base.base_price, item.strength, item.concrete_type, item.slump, params)
          return { ...item, unit_price_cost: cost }
        }
      }
      if (item.product_type === 'pump') {
        const pumpItem = priceItems.find(p => p.product_type === 'pump' && p.factory_id === factoryId && p.product_name === item.pump_size)
        if (pumpItem) {
          const concreteItem = prev.find(i => i.product_type === 'concrete')
          const qty = parseFloat(concreteItem?.quantity) || parseFloat(item.quantity) || 0
          const pipeMeters = item.pipe_meters ?? pumpItem.pipe_included_meters ?? 0
          const cost = qty > 0 ? calcPumpPrice(pumpItem, qty, pipeMeters) : pumpItem.base_price
          return { ...item, quantity: concreteItem?.quantity || item.quantity, unit_price_cost: cost }
        }
      }
      return item
    }))
  }, [factoryId, priceItems, concreteParams])

  function findPumpItem(pumpSize) {
    return priceItems.find(p => p.product_type === 'pump' && p.factory_id === factoryId && p.product_name === pumpSize)
  }

  function calcPumpCost(updated, allItems) {
    const pumpItem = findPumpItem(updated.pump_size)
    if (!pumpItem) return updated.unit_price_cost
    // Quantity always equals concrete quantity
    const concreteItem = allItems.find(i => i.product_type === 'concrete')
    const qty = parseFloat(concreteItem?.quantity) || parseFloat(updated.quantity) || 0
    const pipeMeters = updated.pipe_meters ?? pumpItem.pipe_included_meters ?? 0
    return qty > 0 ? calcPumpPrice(pumpItem, qty, pipeMeters) : pumpItem.base_price
  }

  function updateItem(id, changes) {
    const userEditedCost = 'unit_price_cost' in changes
    setItems(prev => {
      const next = prev.map(item => {
        if (item._id !== id) return item
        const updated = { ...item, ...changes }
        // Only auto-recalc cost if user didn't manually edit it
        if (!userEditedCost) {
          if (updated.product_type === 'concrete' && factoryId) {
            const base = priceItems.find(p => p.product_type === 'concrete' && p.factory_id === factoryId)
            const params = concreteParams.filter(p => p.factory_id === factoryId)
            if (base) updated.unit_price_cost = calcConcretePrice(base.base_price, updated.strength, updated.concrete_type, updated.slump, params)
          }
          if (updated.product_type === 'pump' && factoryId) {
            updated.unit_price_cost = calcPumpCost(updated, prev)
          }
        }
        return updated
      })
      // If concrete quantity changed, sync all pumps (but don't override manually edited pump cost)
      const changedItem = prev.find(i => i._id === id)
      if (changedItem?.product_type === 'concrete' && 'quantity' in changes) {
        return next.map(item => {
          if (item.product_type !== 'pump') return item
          return { ...item, quantity: changes.quantity, unit_price_cost: calcPumpCost(item, next) }
        })
      }
      return next
    })
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i._id !== id))
  }

  async function handleSave() {
    if (!customerId || !factoryId || !location || !scheduledAt || items.length === 0) return
    setSaving(true)
    try {
      const orderData = {
        customer_id: customerId,
        factory_id: factoryId,
        location,
        scheduled_at: new Date(scheduledAt).toISOString(),
        payment_method: paymentMethod || null,
        notes: notes || null,
        status: initial?.status || 'ממתין',
      }

      let orderId = initial?.id
      if (orderId) {
        const { error } = await supabase.from('orders').update(orderData).eq('id', orderId)
        if (error) throw error
        await supabase.from('order_items').delete().eq('order_id', orderId)
      } else {
        const { data, error } = await supabase.from('orders').insert(orderData).select().single()
        if (error) throw error
        orderId = data.id
      }

      const itemsToInsert = items.map(item => ({
        order_id: orderId,
        product_type: item.product_type,
        product_name: item.product_type === 'concrete' ? 'בטון'
          : item.product_type === 'pump' ? `משאבה ${item.pump_size}`
          : item.product_name,
        quantity: parseFloat(item.quantity) || 0,
        is_open_quantity: item.is_open_quantity,
        unit_price_customer: parseFloat(item.unit_price_customer) || 0,
        unit_price_cost: parseFloat(item.unit_price_cost) || 0,
        strength: item.strength || null,
        concrete_type: item.concrete_type || null,
        slump: item.slump ? parseInt(item.slump) : null,
        pump_size: item.pump_size || null,
        pipe_meters: item.pipe_meters || null,
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert)
      if (itemsError) throw itemsError

      onSaved()
    } catch (err) {
      console.error('שגיאה בשמירת הזמנה:', err)
      alert(`שגיאה בשמירה: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const sites = selectedCustomer?.customer_sites?.map(s => s.site_name) || []
  const factoryAccessories = priceItems.filter(p => p.product_type === 'accessory' && p.factory_id === factoryId)
  const valid = customerId && factoryId && location && scheduledAt && items.length > 0

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-10 max-h-[92svh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{initial ? 'עריכת הזמנה' : 'הזמנה חדשה'}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

          <div className="flex flex-col gap-4">
            {/* Customer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">לקוח *</label>
              <select
                value={customerId}
                onChange={e => { setCustomerId(e.target.value); setLocation('') }}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">בחר לקוח...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.company_name ? ` — ${c.company_name}` : ''}</option>
                ))}
              </select>
            </div>

            {/* Location — from customer sites */}
            {customerId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מיקום / אתר *</label>
                {sites.length > 0 ? (
                  <select
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">בחר אתר...</option>
                    {sites.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="כתובת האתר"
                  />
                )}
              </div>
            )}

            {/* Factory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מפעל *</label>
              <select
                value={factoryId}
                onChange={e => setFactoryId(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">בחר מפעל...</option>
                {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            {/* Date & time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תאריך ושעה *</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => { setScheduledAt(e.target.value); e.target.blur() }}
                className="w-full min-w-0 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 block"
                dir="ltr"
                style={{ maxWidth: '100%' }}
              />
            </div>

            {/* Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אמצעי תשלום</label>
              <div className="flex gap-2">
                {['צק', 'העברה', 'העברה בנקאית'].map(m => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setPaymentMethod(paymentMethod === m ? '' : m)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      paymentMethod === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Order items */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">מוצרים *</label>
              <div className="flex flex-col gap-3">
                {items.map(item => (
                  <ItemEditor
                    key={item._id}
                    item={item}
                    factoryAccessories={factoryAccessories}
                    factoryPumps={priceItems.filter(p => p.product_type === 'pump' && p.factory_id === factoryId)}
                    onChange={changes => updateItem(item._id, changes)}
                    onRemove={() => removeItem(item._id)}
                    canRemove={items.length > 1}
                  />
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <button onClick={() => setItems(p => [...p, newConcreteItem()])} className="flex-1 border border-dashed border-gray-300 rounded-xl py-2 text-xs text-gray-500 flex items-center justify-center gap-1">
                  <Plus size={13} /> בטון
                </button>
                <button onClick={() => setItems(p => [...p, newPumpItem()])} className="flex-1 border border-dashed border-gray-300 rounded-xl py-2 text-xs text-gray-500 flex items-center justify-center gap-1">
                  <Plus size={13} /> משאבה
                </button>
                <button onClick={() => setItems(p => [...p, newAccessoryItem()])} className="flex-1 border border-dashed border-gray-300 rounded-xl py-2 text-xs text-gray-500 flex items-center justify-center gap-1">
                  <Plus size={13} /> נלווה
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="הערות נוספות..."
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!valid || saving}
              className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
            >
              {saving ? 'שומר...' : initial ? 'עדכן הזמנה' : 'צור הזמנה'}
            </button>
          </div>
      </div>
    </div>
  )
}

function ItemEditor({ item, factoryAccessories, factoryPumps, onChange, onRemove, canRemove }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-3 relative">
      {canRemove && (
        <button onClick={onRemove} className="absolute top-3 left-3">
          <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
        </button>
      )}

      {item.product_type === 'concrete' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-600 mb-1">בטון</p>
          <SegmentedControl label="חוזק" options={STRENGTH_OPTIONS} value={item.strength} onChange={v => onChange({ strength: v })} />
          <SegmentedControl label="סוג" options={TYPE_OPTIONS} value={item.concrete_type} onChange={v => onChange({ concrete_type: v })} />
          <SegmentedControl label="שקיעה" options={SLUMP_OPTIONS} value={item.slump} onChange={v => onChange({ slump: v })} />
          <QuantityRow item={item} label="קוב" onChange={onChange} />
          <PriceRow item={item} onChange={onChange} />
        </div>
      )}

      {item.product_type === 'pump' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-600 mb-1">משאבה</p>
          <SegmentedControl
            label="גודל"
            options={factoryPumps.map(p => ({ value: p.product_name, label: p.product_name }))}
            value={item.pump_size}
            onChange={v => {
              const pumpItem = factoryPumps.find(p => p.product_name === v)
              onChange({ pump_size: v, pipe_meters: pumpItem?.pipe_included_meters ?? null })
            }}
          />
          {factoryPumps.find(p => p.product_name === item.pump_size)?.pipe_included_meters != null && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 shrink-0">מטרי צינור:</label>
              <input
                type="number"
                value={item.pipe_meters}
                onChange={e => onChange({ pipe_meters: parseFloat(e.target.value) })}
                className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                dir="ltr"
              />
            </div>
          )}
          <PriceRow item={item} onChange={onChange} />
        </div>
      )}

      {item.product_type === 'accessory' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-600 mb-1">מוצר נלווה</p>
          {factoryAccessories.length === 0 ? (
            <p className="text-xs text-orange-500 bg-orange-50 rounded-xl px-3 py-2">
              אין מוצרים נלווים במחירון של מפעל זה. הוסף קודם במחירונים.
            </p>
          ) : (
            <select
              value={item.product_name}
              onChange={e => {
                const acc = factoryAccessories.find(a => a.product_name === e.target.value)
                onChange({ product_name: e.target.value, unit_price_cost: acc?.base_price || '' })
              }}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
            >
              <option value="">בחר מוצר...</option>
              {factoryAccessories.map(a => <option key={a.id} value={a.product_name}>{a.product_name} — {a.base_price}₪</option>)}
            </select>
          )}
          <QuantityRow item={item} label="יח׳" onChange={onChange} />
          <PriceRow item={item} onChange={onChange} />
        </div>
      )}
    </div>
  )
}

function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex gap-1 flex-wrap">
        {options.map(o => (
          <button
            type="button"
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              String(value) === String(o.value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function QuantityRow({ item, label, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <p className="text-xs text-gray-500 mb-1">כמות ({label})</p>
        <input
          type="number"
          value={item.quantity}
          onChange={e => onChange({ quantity: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
          placeholder="0"
          dir="ltr"
        />
      </div>
    </div>
  )
}

function PriceRow({ item, onChange }) {
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <p className="text-xs text-gray-500 mb-1">מחיר ללקוח ₪</p>
        <input
          type="number"
          value={item.unit_price_customer}
          onChange={e => onChange({ unit_price_customer: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
          placeholder="0"
          dir="ltr"
        />
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-500 mb-1">עלות ₪ <span className="text-blue-500">(אוטו)</span></p>
        <input
          type="number"
          value={item.unit_price_cost}
          onChange={e => onChange({ unit_price_cost: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none bg-blue-50"
          placeholder="0"
          dir="ltr"
        />
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_CONCRETE_PARAMS } from '../lib/pricing'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react'

const PARAM_LABELS = {
  b20: 'ב20', b30: 'ב30', b40: 'ב40', b50: 'ב50', b60: 'ב60',
  adash: 'עדש', maico: 'מייקו', dachus: 'דחוס',
  '4': 'שקיעה 4', '5': 'שקיעה 5', '6': 'שקיעה 6', '7': 'שקיעה 7',
}
const PARAM_TYPE_LABELS = { strength: 'חוזק', concrete_type: 'סוג', slump: 'שקיעה' }

export default function PriceListsPage() {
  const [factories, setFactories] = useState([])
  const [items, setItems] = useState({})
  const [concreteParams, setConcreteParams] = useState({})
  const [openFactory, setOpenFactory] = useState(null)
  const [loading, setLoading] = useState(true)

  const [factoryModal, setFactoryModal] = useState(null)
  const [concreteModal, setConcreteModal] = useState(null)   // { factoryId, item }
  const [paramModal, setParamModal] = useState(null)         // { param }
  const [pumpModal, setPumpModal] = useState(null)           // { factoryId, item? }
  const [mixerModal, setMixerModal] = useState(null)         // { factoryId, item }
  const [accessoryModal, setAccessoryModal] = useState(null) // { factoryId, item? }

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: facs }, { data: its }, { data: params }] = await Promise.all([
      supabase.from('factories').select('*').order('created_at'),
      supabase.from('price_list_items').select('*').order('product_type'),
      supabase.from('factory_concrete_params').select('*').order('param_type'),
    ])
    setFactories(facs || [])
    const gi = {}, gp = {}
    for (const f of facs || []) {
      gi[f.id] = (its || []).filter(i => i.factory_id === f.id)
      gp[f.id] = (params || []).filter(p => p.factory_id === f.id)
    }
    setItems(gi)
    setConcreteParams(gp)
    if (facs?.length && !openFactory) setOpenFactory(facs[0].id)
    setLoading(false)
  }

  async function saveFactory({ id, name }) {
    if (id) {
      await supabase.from('factories').update({ name }).eq('id', id)
    } else {
      const { data } = await supabase.from('factories').insert({ name }).select().single()
      if (data) {
        await Promise.all([
          supabase.from('factory_concrete_params').insert(
            DEFAULT_CONCRETE_PARAMS.map(p => ({
              factory_id: data.id, param_type: p.param_type,
              param_value: p.param_value, price_addition: p.price_addition,
            }))
          ),
          supabase.from('price_list_items').insert([
            { factory_id: data.id, product_type: 'concrete', product_name: 'בטון', base_price: 0 },
            { factory_id: data.id, product_type: 'pump', product_name: '36מ', base_price: 1000, extra_per_unit: 30 },
            { factory_id: data.id, product_type: 'pump', product_name: '42מ', base_price: 1500, extra_per_unit: 40 },
            { factory_id: data.id, product_type: 'pump', product_name: '52מ', base_price: 2000, extra_per_unit: 50 },
            { factory_id: data.id, product_type: 'pump', product_name: 'מייקו', base_price: 1500, extra_per_unit: 40, pipe_included_meters: 20, pipe_extra_per_meter: 40 },
            { factory_id: data.id, product_type: 'mixer', product_name: 'מיקסר', base_price: 0, min_cubic_meters: 8, shortfall_fee_cost: 0 },
          ]),
        ])
      }
    }
    setFactoryModal(null)
    fetchAll()
  }

  async function deleteFactory(id) {
    if (!confirm('למחוק מפעל זה ואת כל המחירים שלו?')) return
    await supabase.from('factories').delete().eq('id', id)
    fetchAll()
  }

  async function saveConcrete({ id, factoryId, base_price }) {
    await supabase.from('price_list_items').update({ base_price }).eq('id', id)
    setConcreteModal(null)
    fetchAll()
  }

  async function saveParam({ id, price_addition }) {
    await supabase.from('factory_concrete_params').update({ price_addition }).eq('id', id)
    setParamModal(null)
    fetchAll()
  }

  async function savePump({ id, factoryId, product_name, base_price, extra_per_unit, pipe_included_meters, pipe_extra_per_meter }) {
    const data = { product_type: 'pump', product_name, base_price, extra_per_unit,
      pipe_included_meters: pipe_included_meters || null,
      pipe_extra_per_meter: pipe_extra_per_meter || null }
    if (id) {
      await supabase.from('price_list_items').update(data).eq('id', id)
    } else {
      await supabase.from('price_list_items').insert({ ...data, factory_id: factoryId })
    }
    setPumpModal(null)
    fetchAll()
  }

  async function saveMixer({ id, factoryId, base_price, min_cubic_meters, shortfall_fee_cost }) {
    const data = { base_price, min_cubic_meters, shortfall_fee_cost }
    if (id) {
      await supabase.from('price_list_items').update(data).eq('id', id)
    } else {
      await supabase.from('price_list_items').insert({ ...data, factory_id: factoryId, product_type: 'mixer', product_name: 'מיקסר' })
    }
    setMixerModal(null)
    fetchAll()
  }

  async function saveAccessory({ id, factoryId, product_name, base_price }) {
    if (id) {
      await supabase.from('price_list_items').update({ product_name, base_price }).eq('id', id)
    } else {
      await supabase.from('price_list_items').insert({ factory_id: factoryId, product_type: 'accessory', product_name, base_price })
    }
    setAccessoryModal(null)
    fetchAll()
  }

  async function deleteItem(id) {
    if (!confirm('למחוק?')) return
    await supabase.from('price_list_items').delete().eq('id', id)
    fetchAll()
  }

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-400">טוען...</div>

  return (
    <div className="p-4 pb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">מחירונים</h1>
        <button onClick={() => setFactoryModal({ name: '' })} className="flex items-center gap-1 text-sm text-blue-600 font-medium">
          <Plus size={16} /> מפעל חדש
        </button>
      </div>

      {factories.length === 0 && (
        <div className="text-center text-gray-400 mt-16 text-sm">אין מפעלים עדיין</div>
      )}

      <div className="flex flex-col gap-3">
        {factories.map(factory => {
          const fItems = items[factory.id] || []
          const fParams = concreteParams[factory.id] || []
          const concreteItem = fItems.find(i => i.product_type === 'concrete')
          const pumps = fItems.filter(i => i.product_type === 'pump')
          const mixerItem = fItems.find(i => i.product_type === 'mixer')
          const accessories = fItems.filter(i => i.product_type === 'accessory')
          const isOpen = openFactory === factory.id

          return (
            <div key={factory.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Factory header */}
              <div
                className="flex items-center justify-between px-4 py-3.5 cursor-pointer"
                onClick={() => setOpenFactory(isOpen ? null : factory.id)}
              >
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  <span className="font-bold text-gray-900 text-base">{factory.name}</span>
                </div>
                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setFactoryModal({ id: factory.id, name: factory.name })}>
                    <Pencil size={15} className="text-gray-400" />
                  </button>
                  <button onClick={() => deleteFactory(factory.id)}>
                    <Trash2 size={15} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-100">

                  {/* === CONCRETE === */}
                  <CollapsibleSection title="בטון" defaultOpen>
                    {/* Base price */}
                    <div
                      className={`flex items-center justify-between px-4 py-3 rounded-xl mx-3 mb-2 cursor-pointer ${concreteItem?.base_price === 0 ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}
                      onClick={() => concreteItem && setConcreteModal({ factoryId: factory.id, item: concreteItem })}
                    >
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">מחיר בסיס לקוב</p>
                        <p className="text-sm font-bold text-gray-900">
                          {concreteItem ? (
                            concreteItem.base_price === 0
                              ? <span className="text-orange-500">לא הוגדר — לחץ לעדכון</span>
                              : `${concreteItem.base_price}₪ לקוב`
                          ) : '—'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">בסיס: ב20 + עדש + שקיעה 5</p>
                      </div>
                      <Pencil size={15} className="text-gray-400" />
                    </div>

                    {/* Params */}
                    <div className="px-4 pb-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">תוספות לקוב לפי פרמטר</p>
                      {(['strength', 'concrete_type', 'slump']).map(type => {
                        const typeParams = fParams.filter(p => p.param_type === type)
                        return (
                          <div key={type} className="mb-2">
                            <p className="text-xs text-gray-400 mb-1">{PARAM_TYPE_LABELS[type]}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {typeParams.map(param => (
                                <button
                                  key={param.id}
                                  onClick={() => setParamModal({ param })}
                                  className="flex items-center gap-1 bg-gray-100 hover:bg-blue-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs"
                                >
                                  <span className="text-gray-700">{PARAM_LABELS[param.param_value]}</span>
                                  <span className={`font-semibold ${param.price_addition > 0 ? 'text-orange-500' : param.price_addition < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                    {param.price_addition === 0 ? 'בסיס' : `${param.price_addition > 0 ? '+' : ''}${param.price_addition}₪`}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CollapsibleSection>

                  {/* === PUMPS === */}
                  <CollapsibleSection title="משאבות" defaultOpen>
                    <div className="px-3 pb-3 flex flex-col gap-2">
                      {pumps.map(pump => (
                        <div key={pump.id} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">{pump.product_name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {pump.base_price}₪ לראשונים 10 קוב · {pump.extra_per_unit}₪/קוב נוסף
                            </p>
                            {pump.pipe_included_meters != null && (
                              <p className="text-xs text-gray-500">
                                צינור: {pump.pipe_included_meters}מ כלולים · {pump.pipe_extra_per_meter}₪/מ נוסף
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 mt-0.5">
                            <button onClick={() => setPumpModal({ factoryId: factory.id, item: pump })}>
                              <Pencil size={14} className="text-gray-400" />
                            </button>
                            <button onClick={() => deleteItem(pump.id)}>
                              <Trash2 size={14} className="text-gray-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setPumpModal({ factoryId: factory.id })}
                        className="flex items-center justify-center gap-1 border border-dashed border-gray-300 rounded-xl py-2 text-xs text-blue-600"
                      >
                        <Plus size={13} /> הוסף משאבה
                      </button>
                    </div>
                  </CollapsibleSection>

                  {/* === MIXER === */}
                  <CollapsibleSection title="מיקסר">
                    <div
                      className={`flex items-center justify-between px-4 py-3 rounded-xl mx-3 mb-3 cursor-pointer ${!mixerItem || mixerItem.base_price === 0 ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}
                      onClick={() => mixerItem && setMixerModal({ factoryId: factory.id, item: mixerItem })}
                    >
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">מחיר עלות בסיס</p>
                        <p className="text-sm font-bold text-gray-900">
                          {mixerItem ? (
                            mixerItem.base_price === 0
                              ? <span className="text-orange-500">לא הוגדר — לחץ לעדכון</span>
                              : `${mixerItem.base_price}₪`
                          ) : '—'}
                        </p>
                        {mixerItem && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            רף: {mixerItem.min_cubic_meters ?? 0} קוב · דמי השלמה: {mixerItem.shortfall_fee_cost ?? 0}₪/קוב חסר
                          </p>
                        )}
                      </div>
                      <Pencil size={15} className="text-gray-400" />
                    </div>
                  </CollapsibleSection>

                  {/* === ACCESSORIES === */}
                  <CollapsibleSection title="מוצרים נלווים">
                    <div className="px-3 pb-3 flex flex-col gap-2">
                      {accessories.length === 0 && (
                        <p className="text-xs text-gray-400 px-1">אין מוצרים נלווים עדיין</p>
                      )}
                      {accessories.map(acc => (
                        <div key={acc.id} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{acc.product_name}</p>
                            <p className="text-xs text-gray-500">{acc.base_price}₪ ליחידה</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setAccessoryModal({ factoryId: factory.id, item: acc })}>
                              <Pencil size={14} className="text-gray-400" />
                            </button>
                            <button onClick={() => deleteItem(acc.id)}>
                              <Trash2 size={14} className="text-gray-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setAccessoryModal({ factoryId: factory.id })}
                        className="flex items-center justify-center gap-1 border border-dashed border-gray-300 rounded-xl py-2 text-xs text-blue-600"
                      >
                        <Plus size={13} /> הוסף מוצר נלווה
                      </button>
                    </div>
                  </CollapsibleSection>

                </div>
              )}
            </div>
          )
        })}
      </div>

      {factoryModal && <FactoryModal initial={factoryModal} onSave={saveFactory} onClose={() => setFactoryModal(null)} />}
      {concreteModal && <ConcreteModal initial={concreteModal} onSave={saveConcrete} onClose={() => setConcreteModal(null)} />}
      {paramModal && <ParamModal param={paramModal.param} onSave={saveParam} onClose={() => setParamModal(null)} />}
      {pumpModal && <PumpModal initial={pumpModal} onSave={savePump} onClose={() => setPumpModal(null)} />}
      {mixerModal && <MixerModal initial={mixerModal} onSave={saveMixer} onClose={() => setMixerModal(null)} />}
      {accessoryModal && <AccessoryModal initial={accessoryModal} onSave={saveAccessory} onClose={() => setAccessoryModal(null)} />}
    </div>
  )
}

// ─── Collapsible Section ───────────────────────────────────────────────────────

function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</span>
        {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </button>
      {open && <div className="pt-2">{children}</div>}
    </div>
  )
}

// ─── Modals ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FactoryModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial.name || '')
  return (
    <Modal title={initial.id ? 'עריכת מפעל' : 'מפעל חדש'} onClose={onClose}>
      <label className="block text-sm font-medium text-gray-700 mb-1">שם המפעל</label>
      <input autoFocus value={name} onChange={e => setName(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="לדוגמא: נ.כ.ל" />
      <button onClick={() => name.trim() && onSave({ ...initial, name: name.trim() })}
        disabled={!name.trim()}
        className="mt-4 w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-40">
        שמור
      </button>
    </Modal>
  )
}

function ConcreteModal({ initial, onSave, onClose }) {
  const [price, setPrice] = useState(initial.item?.base_price ?? '')
  return (
    <Modal title="מחיר בסיס בטון" onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4">המחיר שהמפעל גובה לקוב בטון סטנדרטי (ב20 + עדש + שקיעה 5)</p>
      <label className="block text-sm font-medium text-gray-700 mb-1">מחיר לקוב (₪)</label>
      <input autoFocus type="number" value={price} onChange={e => setPrice(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="0" dir="ltr" />
      <button onClick={() => price !== '' && onSave({ ...initial.item, factoryId: initial.factoryId, base_price: parseFloat(price) })}
        disabled={price === ''}
        className="mt-4 w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-40">
        שמור
      </button>
    </Modal>
  )
}

function ParamModal({ param, onSave, onClose }) {
  const [addition, setAddition] = useState(param.price_addition ?? 0)
  return (
    <Modal title={`תוספת — ${PARAM_LABELS[param.param_value]}`} onClose={onClose}>
      <label className="block text-sm font-medium text-gray-700 mb-1">תוספת לקוב (₪)</label>
      <input type="number" value={addition} onChange={e => setAddition(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        dir="ltr" />
      <p className="text-xs text-gray-400 mt-1">ערך שלילי = הנחה · 0 = מחיר בסיס</p>
      <button onClick={() => onSave({ id: param.id, price_addition: parseFloat(addition) })}
        className="mt-4 w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium">
        שמור
      </button>
    </Modal>
  )
}

function PumpModal({ initial, onSave, onClose }) {
  const item = initial?.item
  const [name, setName] = useState(item?.product_name || '')
  const [basePrice, setBasePrice] = useState(item?.base_price ?? '')
  const [extraPerUnit, setExtraPerUnit] = useState(item?.extra_per_unit ?? '')
  const [pipeIncluded, setPipeIncluded] = useState(item?.pipe_included_meters ?? '')
  const [pipeExtra, setPipeExtra] = useState(item?.pipe_extra_per_meter ?? '')
  const hasPipe = pipeIncluded !== '' || pipeExtra !== ''
  const [showPipe, setShowPipe] = useState(!!item?.pipe_included_meters)

  const valid = name.trim() && basePrice !== '' && extraPerUnit !== ''

  return (
    <Modal title={item ? 'עריכת משאבה' : 'משאבה חדשה'} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם / גודל</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder='לדוגמא: 36מ או מייקו' />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מחיר בסיס לראשונים 10 קוב (₪)</label>
          <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מחיר לקוב נוסף מעל 10 (₪)</label>
          <input type="number" value={extraPerUnit} onChange={e => setExtraPerUnit(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0" dir="ltr" />
        </div>

        {/* Pipe section */}
        <button
          onClick={() => setShowPipe(p => !p)}
          className="flex items-center gap-2 text-sm text-blue-600 font-medium"
        >
          {showPipe ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          עלות צינורות (למשאבת מייקו וכדומה)
        </button>
        {showPipe && (
          <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מטרי צינור כלולים</label>
              <input type="number" value={pipeIncluded} onChange={e => setPipeIncluded(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="20" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מחיר למטר נוסף (₪)</label>
              <input type="number" value={pipeExtra} onChange={e => setPipeExtra(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="40" dir="ltr" />
            </div>
          </div>
        )}

        <button
          onClick={() => valid && onSave({
            id: item?.id, factoryId: initial.factoryId,
            product_name: name.trim(),
            base_price: parseFloat(basePrice),
            extra_per_unit: parseFloat(extraPerUnit),
            pipe_included_meters: showPipe && pipeIncluded !== '' ? parseFloat(pipeIncluded) : null,
            pipe_extra_per_meter: showPipe && pipeExtra !== '' ? parseFloat(pipeExtra) : null,
          })}
          disabled={!valid}
          className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-40"
        >
          שמור
        </button>
      </div>
    </Modal>
  )
}

function MixerModal({ initial, onSave, onClose }) {
  const item = initial.item
  const [basePrice, setBasePrice] = useState(item?.base_price ?? '')
  const [minCubicMeters, setMinCubicMeters] = useState(item?.min_cubic_meters ?? '')
  const [shortfallFee, setShortfallFee] = useState(item?.shortfall_fee_cost ?? '')

  const valid = basePrice !== '' && minCubicMeters !== '' && shortfallFee !== ''

  return (
    <Modal title="מיקסר" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מחיר עלות בסיס (₪)</label>
          <input autoFocus type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">רף קוב מינימלי</label>
          <input type="number" value={minCubicMeters} onChange={e => setMinCubicMeters(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="8" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">דמי השלמה לקוב חסר (₪)</label>
          <input type="number" value={shortfallFee} onChange={e => setShortfallFee(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0" dir="ltr" />
          <p className="text-xs text-gray-400 mt-1">נגבה עבור כל קוב מתחת לרף, בנוסף למחיר העלות הבסיסי</p>
        </div>
        <button
          onClick={() => valid && onSave({
            id: item?.id, factoryId: initial.factoryId,
            base_price: parseFloat(basePrice),
            min_cubic_meters: parseFloat(minCubicMeters),
            shortfall_fee_cost: parseFloat(shortfallFee),
          })}
          disabled={!valid}
          className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-40"
        >
          שמור
        </button>
      </div>
    </Modal>
  )
}

function AccessoryModal({ initial, onSave, onClose }) {
  const item = initial?.item
  const [name, setName] = useState(item?.product_name || '')
  const [price, setPrice] = useState(item?.base_price ?? '')

  return (
    <Modal title={item ? 'עריכת מוצר נלווה' : 'מוצר נלווה חדש'} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם המוצר</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="לדוגמא: צנרת" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מחיר ליחידה (₪)</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0" dir="ltr" />
        </div>
        <button
          onClick={() => name.trim() && price !== '' && onSave({ id: item?.id, factoryId: initial.factoryId, product_name: name.trim(), base_price: parseFloat(price) })}
          disabled={!name.trim() || price === ''}
          className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-40"
        >
          שמור
        </button>
      </div>
    </Modal>
  )
}

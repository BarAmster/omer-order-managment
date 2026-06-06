import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, Pencil, Trash2, Clock, MapPin, Building2, CreditCard, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'

const STATUS_COLORS = {
  'ממתין': 'bg-yellow-100 text-yellow-700',
  'סגור': 'bg-green-100 text-green-700',
  'בוטל': 'bg-red-100 text-red-700',
  'נדחה': 'bg-gray-100 text-gray-600',
}

const STRENGTH_LABELS = { b20:'ב20', b30:'ב30', b40:'ב40', b50:'ב50', b60:'ב60' }
const TYPE_LABELS = { adash:'עדש', maico:'מייקו', dachus:'דחוס' }

export default function OrderDrawer({ order, onClose, onEdit, onRefresh, readOnly = false }) {
  const [showFinancial, setShowFinancial] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const [deferDate, setDeferDate] = useState('')

  async function updateStatus(status) {
    const update = { status }
    if (status === 'נדחה' && deferDate) {
      update.original_scheduled_at = order.scheduled_at
      update.scheduled_at = new Date(deferDate).toISOString()
    }
    await supabase.from('orders').update(update).eq('id', order.id)
    onRefresh()
  }

  async function deleteOrder() {
    if (!confirm('למחוק הזמנה זו?')) return
    await supabase.from('orders').delete().eq('id', order.id)
    onRefresh()
  }

  function concreteQty() {
    const c = order.order_items?.find(i => i.product_type === 'concrete')
    return c ? `${c.quantity}${c.is_open_quantity ? '+' : ''}` : null
  }

  function itemRows(item) {
    if (item.product_type === 'concrete') {
      const label = [STRENGTH_LABELS[item.strength], TYPE_LABELS[item.concrete_type], item.slump ? `שקיעה ${item.slump}` : null].filter(Boolean).join(' · ')
      const qty = `${item.quantity}${item.is_open_quantity ? '+' : ''} קוב`
      const unitPrice = `${item.unit_price_customer}₪/קוב`
      return { title: `בטון — ${label}`, sub: `${qty} × ${unitPrice}` }
    }
    if (item.product_type === 'pump') {
      const qty = parseFloat(item.quantity) || 0
      const concreteQtyStr = concreteQty() || `${qty}`
      const base10 = Math.min(qty, 10)
      const extra = Math.max(0, qty - 10)
      let breakdown = `${concreteQtyStr} קוב שאיבה`
      if (extra > 0) breakdown += ` (10 ראשונים + ${extra} נוספים)`
      if (item.pipe_meters != null) breakdown += ` · ${item.pipe_meters}מ צינור`
      return {
        title: `משאבה ${item.product_name}`,
        sub: breakdown,
        subExtra: `מחיר שאיבה: ${item.unit_price_customer}₪`,
      }
    }
    return {
      title: item.product_name,
      sub: `${item.quantity}${item.is_open_quantity ? '+' : ''} יח׳ × ${item.unit_price_customer}₪`,
    }
  }

  function itemTotal(i, field) {
    // pump price is per job (not per unit), cost is also per job
    if (i.product_type === 'pump') return i[field] || 0
    return i.quantity * (i[field] || 0)
  }
  const totalCustomer = order.order_items?.reduce((s, i) => s + itemTotal(i, 'unit_price_customer'), 0) || 0
  const totalCost = order.order_items?.reduce((s, i) => s + itemTotal(i, 'unit_price_cost'), 0) || 0
  const profit = totalCustomer - totalCost

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl max-h-[88svh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 mt-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{order.customers?.name}</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
              </div>
              {order.customers?.company_name && (
                <p className="text-sm text-gray-500 mt-0.5">{order.customers.company_name}</p>
              )}
            </div>
            <button onClick={onClose} className="mr-2"><X size={20} className="text-gray-400" /></button>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-2 mb-5">
            <InfoRow icon={Clock} text={
              new Date(order.scheduled_at).toLocaleString('he-IL', {
                weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
              })
            } />
            {order.original_scheduled_at && (
              <p className="text-xs text-orange-500 mr-6">
                נדחה מ-{new Date(order.original_scheduled_at).toLocaleDateString('he-IL')}
              </p>
            )}
            <InfoRow icon={MapPin} text={order.location} />
            <InfoRow icon={Building2} text={order.factories?.name} />
            {order.payment_method && <InfoRow icon={CreditCard} text={order.payment_method} />}
          </div>

          {/* Order items */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">פרטי הזמנה</p>
            <div className="flex flex-col gap-3">
              {order.order_items?.map(item => {
                const row = itemRows(item)
                const total = item.product_type === 'pump'
                  ? item.unit_price_customer
                  : item.quantity * item.unit_price_customer
                return (
                  <div key={item.id} className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{row.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{row.sub}</p>
                      {row.subExtra && <p className="text-xs text-gray-400">{row.subExtra}</p>}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 shrink-0">
                      {total.toLocaleString('he-IL')}₪
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between">
              <span className="text-sm font-semibold text-gray-700">סה״כ</span>
              <span className="text-sm font-bold text-gray-900">{totalCustomer.toLocaleString('he-IL')}₪</span>
            </div>
          </div>

          {/* Financial section */}
          <button
            onClick={() => setShowFinancial(!showFinancial)}
            className="w-full flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 mb-4"
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-700">מצב כספי</span>
            </div>
            {showFinancial ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {showFinancial && (
            <div className="bg-blue-50 rounded-2xl p-4 mb-4">
              <div className="flex flex-col gap-2">
                {order.order_items?.map(item => {
                  const rev = itemTotal(item, 'unit_price_customer')
                  const cost = itemTotal(item, 'unit_price_cost')
                  return (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{itemRows(item).title}</span>
                      <span className={`font-semibold ${rev - cost >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {(rev - cost) >= 0 ? '+' : ''}{(rev - cost).toLocaleString('he-IL')}₪
                      </span>
                    </div>
                  )
                })}
                <div className="border-t border-blue-200 mt-1 pt-2 flex justify-between">
                  <span className="text-sm font-semibold text-gray-700">רווח כולל</span>
                  <span className={`text-sm font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {profit >= 0 ? '+' : ''}{profit.toLocaleString('he-IL')}₪
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-4">
              <p className="text-xs text-gray-400 mb-1">הערות</p>
              <p className="text-sm text-gray-700">{order.notes}</p>
            </div>
          )}

          {/* Status change + Actions — hidden in readOnly */}
          {!readOnly && (
            <>
              <div className="mb-4">
                <button
                  onClick={() => setChangingStatus(!changingStatus)}
                  className="w-full flex items-center justify-between border border-gray-200 rounded-2xl px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-700">שינוי סטטוס</span>
                  {changingStatus ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {changingStatus && (
                  <div className="mt-2 flex flex-col gap-2">
                    {order.status !== 'נדחה' && (
                      <div className="flex flex-col gap-2 bg-gray-50 rounded-2xl p-3">
                        <p className="text-xs text-gray-500">דחייה לתאריך:</p>
                        <input
                          type="datetime-local"
                          value={deferDate}
                          onChange={e => setDeferDate(e.target.value)}
                          className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          dir="ltr"
                        />
                        <button
                          onClick={() => deferDate && updateStatus('נדחה')}
                          disabled={!deferDate}
                          className="bg-gray-700 text-white rounded-xl py-2 text-sm font-medium disabled:opacity-40"
                        >
                          דחה הזמנה
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {['ממתין','סגור','בוטל'].filter(s => s !== order.status).map(s => (
                        <button
                          key={s}
                          onClick={() => updateStatus(s)}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium border ${STATUS_COLORS[s]}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(order)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Pencil size={14} /> עריכה
                </button>
                <button
                  onClick={deleteOrder}
                  className="flex-1 border border-red-200 text-red-500 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} /> מחיקה
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-700">
      <Icon size={15} className="text-gray-400 shrink-0" />
      <span>{text}</span>
    </div>
  )
}

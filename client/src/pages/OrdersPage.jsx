import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, ChevronRight, ChevronLeft, Search, X } from 'lucide-react'
import OrderDrawer from '../components/OrderDrawer'
import OrderForm from '../components/OrderForm'

const VIEWS = ['יומי', 'שבועי', 'חודשי']

const STATUS_COLORS = {
  'ממתין': 'bg-yellow-100 text-yellow-700',
  'סגור': 'bg-green-100 text-green-700',
  'בוטל': 'bg-red-100 text-red-700',
  'נדחה': 'bg-gray-100 text-gray-600',
}

export default function OrdersPage() {
  const [view, setView] = useState('יומי')
  const [anchor, setAnchor] = useState(startOfDay(new Date()))
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFactory, setFilterFactory] = useState('')
  const [factories, setFactories] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editOrder, setEditOrder] = useState(null)

  useEffect(() => { fetchFactories() }, [])
  useEffect(() => { fetchOrders() }, [anchor, view])

  function startOfDay(d) {
    const r = new Date(d); r.setHours(0,0,0,0); return r
  }

  function getRange() {
    const from = new Date(anchor)
    const to = new Date(anchor)
    if (view === 'יומי') { to.setDate(to.getDate() + 1) }
    else if (view === 'שבועי') { to.setDate(to.getDate() + 7) }
    else { to.setMonth(to.getMonth() + 1) }
    return { from, to }
  }

  function navigate(dir) {
    const d = new Date(anchor)
    if (view === 'יומי') d.setDate(d.getDate() + dir)
    else if (view === 'שבועי') d.setDate(d.getDate() + 7 * dir)
    else d.setMonth(d.getMonth() + dir)
    setAnchor(d)
  }

  function formatRangeLabel() {
    const { from, to } = getRange()
    const opts = { day: 'numeric', month: 'long' }
    if (view === 'יומי') return from.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
    if (view === 'שבועי') {
      const end = new Date(to); end.setDate(end.getDate() - 1)
      return `${from.toLocaleDateString('he-IL', opts)} – ${end.toLocaleDateString('he-IL', opts)}`
    }
    return from.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
  }

  async function fetchFactories() {
    const { data } = await supabase.from('factories').select('id, name').order('created_at')
    setFactories(data || [])
  }

  async function fetchOrders() {
    setLoading(true)
    const { from, to } = getRange()
    const { data } = await supabase
      .from('orders')
      .select(`
        id, scheduled_at, original_scheduled_at, location, status, payment_method, notes,
        customers(id, name, company_name, phone),
        factories(id, name),
        order_items(*)
      `)
      .gte('scheduled_at', from.toISOString())
      .lt('scheduled_at', to.toISOString())
      .order('scheduled_at')
    setOrders(data || [])
    setLoading(false)
  }

  function filtered() {
    return orders.filter(o => {
      if (filterStatus && o.status !== filterStatus) return false
      if (filterFactory && o.factories?.id !== filterFactory) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          o.customers?.name?.toLowerCase().includes(q) ||
          o.location?.toLowerCase().includes(q) ||
          o.factories?.name?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }

  function orderSummary(order) {
    const concrete = order.order_items?.find(i => i.product_type === 'concrete')
    const pump = order.order_items?.find(i => i.product_type === 'pump')
    const parts = []
    if (concrete) parts.push(`${concrete.quantity}${concrete.is_open_quantity ? '+' : ''} קוב`)
    if (pump) parts.push(`משאבה ${concrete?.product_name || ''}`)
    return parts.join(' + ') || '—'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900 mb-3">הזמנות</h1>

        {/* View toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
          {VIEWS.map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Date navigation */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate(1)} className="p-1 text-gray-400 hover:text-gray-700">
            <ChevronRight size={20} />
          </button>
          <span className="text-sm font-medium text-gray-800">{formatRangeLabel()}</span>
          <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-gray-700">
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש..."
            className="w-full bg-gray-100 rounded-xl pr-9 pl-4 py-2 text-sm focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2">
              <X size={14} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <FilterChip label="כל הסטטוסים" value="" current={filterStatus} onChange={setFilterStatus} />
          {['ממתין','סגור','בוטל','נדחה'].map(s => (
            <FilterChip key={s} label={s} value={s} current={filterStatus} onChange={setFilterStatus} />
          ))}
        </div>
        {factories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mt-1.5 no-scrollbar">
            <FilterChip label="כל המפעלים" value="" current={filterFactory} onChange={setFilterFactory} />
            {factories.map(f => (
              <FilterChip key={f.id} label={f.name} value={f.id} current={filterFactory} onChange={setFilterFactory} />
            ))}
          </div>
        )}
      </div>

      {/* Orders list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="text-center text-gray-400 mt-10 text-sm">טוען...</div>
        ) : filtered().length === 0 ? (
          <div className="text-center text-gray-400 mt-16 text-sm">אין הזמנות בתקופה זו</div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered().map(order => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white rounded-2xl border border-gray-200 px-4 py-3 cursor-pointer active:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{order.customers?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{order.location}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">{orderSummary(order)}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(order.scheduled_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}{order.factories?.name}
                  </span>
                </div>
                {order.original_scheduled_at && (
                  <p className="text-xs text-orange-500 mt-1">
                    נדחה מ-{new Date(order.original_scheduled_at).toLocaleDateString('he-IL')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditOrder(null); setShowForm(true) }}
        className="fixed bottom-20 left-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-30 active:scale-95 transition-transform"
      >
        <Plus size={26} />
      </button>

      {/* Order drawer */}
      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onEdit={order => { setEditOrder(order); setSelectedOrder(null); setShowForm(true) }}
          onRefresh={() => { fetchOrders(); setSelectedOrder(null) }}
        />
      )}

      {/* Order form */}
      {showForm && (
        <OrderForm
          initial={editOrder}
          onClose={() => { setShowForm(false); setEditOrder(null) }}
          onSaved={() => { setShowForm(false); setEditOrder(null); fetchOrders() }}
        />
      )}
    </div>
  )
}

function FilterChip({ label, value, current, onChange }) {
  const active = current === value
  return (
    <button
      onClick={() => onChange(value)}
      className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
        active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
      }`}
    >
      {label}
    </button>
  )
}

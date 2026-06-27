import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Pencil, Trash2, X, ChevronLeft, Phone, Hash, MapPin } from 'lucide-react'
import OrderDrawer from '../components/OrderDrawer'
import CustomerModal from '../components/CustomerModal'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)       // null | { customer? }
  const [detailId, setDetailId] = useState(null) // customer id for detail view

  useEffect(() => { fetchCustomers() }, [])

  async function fetchCustomers() {
    setLoading(true)
    const { data } = await supabase
      .from('customers')
      .select('*, customer_sites(*)')
      .order('name')
    setCustomers(data || [])
    setLoading(false)
  }

  async function saveCustomer({ id, name, company_name, vat_id, phone, sites }) {
    if (id) {
      await supabase.from('customers').update({ name, company_name, vat_id, phone }).eq('id', id)
      // Replace sites
      await supabase.from('customer_sites').delete().eq('customer_id', id)
      if (sites.length) {
        await supabase.from('customer_sites').insert(sites.map(s => ({ customer_id: id, site_name: s })))
      }
    } else {
      const { data } = await supabase
        .from('customers')
        .insert({ name, company_name, vat_id, phone, type: 'regular' })
        .select()
        .single()
      if (data && sites.length) {
        await supabase.from('customer_sites').insert(sites.map(s => ({ customer_id: data.id, site_name: s })))
      }
    }
    setModal(null)
    fetchCustomers()
  }

  async function deleteCustomer(id) {
    if (!confirm('למחוק לקוח זה?')) return
    await supabase.from('customers').delete().eq('id', id)
    if (detailId === id) setDetailId(null)
    fetchCustomers()
  }

  const filtered = customers.filter(c =>
    c.name.includes(search) ||
    (c.company_name || '').includes(search) ||
    (c.phone || '').includes(search)
  )

  const selectedCustomer = customers.find(c => c.id === detailId)

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-400">טוען...</div>

  return (
    <div className="p-4 pb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">לקוחות</h1>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-1 text-sm text-blue-600 font-medium"
        >
          <Plus size={16} /> לקוח חדש
        </button>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="חיפוש לפי שם, חברה או טלפון..."
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {filtered.length === 0 && (
        <div className="text-center text-gray-400 mt-16 text-sm">
          {search ? 'לא נמצאו לקוחות' : 'אין לקוחות עדיין'}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map(customer => (
          <div
            key={customer.id}
            onClick={() => setDetailId(customer.id)}
            className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center justify-between cursor-pointer active:bg-gray-50"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
              <div className="flex items-center gap-3 mt-0.5">
                {customer.company_name && (
                  <span className="text-xs text-gray-400 truncate">{customer.company_name}</span>
                )}
                {customer.phone && (
                  <span className="text-xs text-gray-400">{customer.phone}</span>
                )}
              </div>
              {customer.customer_sites?.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {customer.customer_sites.length} אתרים
                </p>
              )}
            </div>
            <ChevronLeft size={16} className="text-gray-300 shrink-0" />
          </div>
        ))}
      </div>

      {/* Customer detail drawer */}
      {selectedCustomer && (
        <CustomerDetail
          customer={selectedCustomer}
          onClose={() => setDetailId(null)}
          onEdit={() => { setModal({ customer: selectedCustomer }); setDetailId(null) }}
          onDelete={() => deleteCustomer(selectedCustomer.id)}
        />
      )}

      {/* Add/Edit modal */}
      {modal !== null && (
        <CustomerModal
          initial={modal.customer}
          onSave={saveCustomer}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function CustomerDetail({ customer, onClose, onEdit, onDelete }) {
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    async function fetchOrders() {
      const { data } = await supabase
        .from('orders')
        .select(`
          id, scheduled_at, original_scheduled_at, location, status, payment_method, notes,
          customers(id, name, company_name, phone),
          factories(id, name),
          order_items(*)
        `)
        .eq('customer_id', customer.id)
        .order('scheduled_at', { ascending: false })
        .limit(20)
      setOrders(data || [])
      setLoadingOrders(false)
    }
    fetchOrders()
  }, [customer.id])

  const STATUS_COLORS = {
    'ממתין': 'bg-yellow-100 text-yellow-700',
    'סגור': 'bg-green-100 text-green-700',
    'בוטל': 'bg-red-100 text-red-700',
    'נדחה': 'bg-gray-100 text-gray-600',
  }

  return (
    <>
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-10 max-h-[85svh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
            {customer.company_name && (
              <p className="text-sm text-gray-500 mt-0.5">{customer.company_name}</p>
            )}
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-2 mb-5">
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone size={15} className="text-gray-400" />
              <span dir="ltr">{customer.phone}</span>
            </div>
          )}
          {customer.vat_id && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Hash size={15} className="text-gray-400" />
              <span>ח.פ: {customer.vat_id}</span>
            </div>
          )}
          {customer.customer_sites?.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <MapPin size={15} className="text-gray-400 mt-0.5" />
              <div className="flex flex-wrap gap-1.5">
                {customer.customer_sites.map(s => (
                  <span key={s.id} className="bg-gray-100 rounded-lg px-2 py-0.5 text-xs">{s.site_name}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order history */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">היסטוריית הזמנות</p>
          {loadingOrders ? (
            <p className="text-sm text-gray-400">טוען...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-400">אין הזמנות עדיין</p>
          ) : (
            <div className="flex flex-col gap-2">
              {orders.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 cursor-pointer active:bg-gray-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{order.location}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.scheduled_at).toLocaleDateString('he-IL')} · {order.factories?.name}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={onEdit}
            className="flex-1 border border-gray-300 text-gray-700 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1"
          >
            <Pencil size={14} /> עריכה
          </button>
          <button
            onClick={onDelete}
            className="flex-1 border border-red-200 text-red-500 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1"
          >
            <Trash2 size={14} /> מחיקה
          </button>
        </div>
      </div>
    </div>

    {selectedOrder && (
      <OrderDrawer
        order={selectedOrder}
        readOnly
        onClose={() => setSelectedOrder(null)}
        onRefresh={() => setSelectedOrder(null)}
      />
    )}
    </>
  )
}


import { useState } from 'react'
import { X } from 'lucide-react'

export default function CustomerModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '')
  const [company, setCompany] = useState(initial?.company_name || '')
  const [vatId, setVatId] = useState(initial?.vat_id || '')
  const [phone, setPhone] = useState(initial?.phone || '')
  const [sites, setSites] = useState(initial?.customer_sites?.map(s => s.site_name) || [])
  const [newSite, setNewSite] = useState('')

  function addSite() {
    if (newSite.trim() && !sites.includes(newSite.trim())) {
      setSites([...sites, newSite.trim()])
      setNewSite('')
    }
  }

  function removeSite(site) {
    setSites(sites.filter(s => s !== site))
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-10 max-h-[90svh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{initial?.id ? 'עריכת לקוח' : 'לקוח חדש'}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="שם מלא *" value={name} onChange={setName} placeholder="ישראל ישראלי" />
          <Field label="שם חברה" value={company} onChange={setCompany} placeholder="חברת הבניה בע״מ" />
          <Field label="ח.פ / ת.ז / ע.מ" value={vatId} onChange={setVatId} placeholder="123456789" dir="ltr" />
          <Field label="טלפון" value={phone} onChange={setPhone} placeholder="050-0000000" dir="ltr" />

          {/* Sites */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אתרי בניה</label>
            <div className="flex gap-2 mb-2">
              <input
                value={newSite}
                onChange={e => setNewSite(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSite()}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="שם האתר"
              />
              <button
                onClick={addSite}
                disabled={!newSite.trim()}
                className="bg-blue-600 text-white rounded-xl px-4 text-sm font-medium disabled:opacity-40"
              >
                הוסף
              </button>
            </div>
            {sites.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sites.map(site => (
                  <span key={site} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2.5 py-1 text-sm">
                    {site}
                    <button onClick={() => removeSite(site)}>
                      <X size={12} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => name.trim() && onSave({
              id: initial?.id,
              name: name.trim(),
              company_name: company.trim() || null,
              vat_id: vatId.trim() || null,
              phone: phone.trim() || null,
              sites,
            })}
            disabled={!name.trim()}
            className="mt-2 w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-40"
          >
            שמור
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, dir }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

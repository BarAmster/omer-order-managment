import { supabase } from './supabase'

// Inserts a new customer (+ sites) and returns the customer object in the same
// shape OrderForm holds in its `customers` state, so it can be selected immediately.
export async function createCustomer({ name, company_name, vat_id, phone, sites }) {
  const { data, error } = await supabase
    .from('customers')
    .insert({ name, company_name, vat_id, phone, type: 'regular' })
    .select('id, name, company_name')
    .single()
  if (error) throw error

  if (sites?.length) {
    const { error: sitesError } = await supabase
      .from('customer_sites')
      .insert(sites.map(s => ({ customer_id: data.id, site_name: s })))
    if (sitesError) throw sitesError
  }

  return { ...data, customer_sites: (sites || []).map(s => ({ site_name: s })) }
}

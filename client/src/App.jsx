import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import MainLayout from './components/MainLayout'
import OrdersPage from './pages/OrdersPage'
import CustomersPage from './pages/CustomersPage'
import PriceListsPage from './pages/PriceListsPage'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute session={session}>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<OrdersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="pricelists" element={<PriceListsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

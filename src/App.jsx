import { Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '@components/Layout'

// Pages
import Dashboard from '@pages/Dashboard'
import Sales from '@pages/Sales'
import Inventory from '@pages/Inventory'
import Receipts from '@pages/Receipts'
import CloseCash from '@pages/CloseCash'
import ProductLabel from '@pages/ProductLabel'
import NotFound from '@pages/NotFound'

function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="sales" element={<Sales />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="receipts" element={<Receipts />} />
          <Route path="close" element={<CloseCash />} />
          <Route path="label/:id" element={<ProductLabel />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default App

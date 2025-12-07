import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Stores from './pages/Stores'
import Products from './pages/Products'
import ProductForm from './pages/ProductForm'
import OAuthCallback from './pages/OAuthCallback'

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="stores" element={<Stores />} />
                <Route path="products" element={<Products />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/edit/:id" element={<ProductForm />} />
            </Route>
            <Route path="/auth/callback" element={<OAuthCallback />} />
        </Routes>
    )
}

export default App

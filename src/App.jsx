import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import RequireAdmin from './components/RequireAdmin.jsx';
import NotFound from './pages/NotFound.jsx';

import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Women from './pages/Women.jsx';
import Men from './pages/Men.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import Cart from './pages/Cart.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Account from './pages/Account.jsx';
import Orders from './pages/Orders.jsx';
import Contact from './pages/Contact.jsx';
import About from './pages/About.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/boutique" element={<Shop />} />
          <Route path="/femme" element={<Women />} />
          <Route path="/homme" element={<Men />} />
          <Route path="/produit/:slug" element={<ProductDetails />} />
          <Route path="/panier" element={<Cart />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/mon-compte" element={<Account />} />
          <Route path="/mes-commandes" element={<Orders />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/a-propos" element={<About />} />
        </Route>

        <Route
          path="/admin"
          element={(
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          )}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="produits" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="commandes" element={<AdminOrders />} />
          <Route path="clients" element={<AdminUsers />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

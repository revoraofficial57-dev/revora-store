/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HomePage } from './components/storefront/HomePage';
import { ShopCatalog } from './components/storefront/ShopCatalog';
import { ProductDetailPage } from './components/storefront/ProductDetailPage';
import { CartDrawer } from './components/storefront/CartDrawer';
import { CheckoutPage } from './components/storefront/CheckoutPage';
import { OrderConfirmationPage } from './components/storefront/OrderConfirmationPage';
import { OrderTrackingPage } from './components/storefront/OrderTrackingPage';
import { CustomerAccountPage } from './components/storefront/CustomerAccountPage';
import { ComplaintsSupportPage } from './components/storefront/ComplaintsSupportPage';
import { StorePoliciesPage } from './components/storefront/StorePoliciesPage';
import { CustomerReviewsPage } from './components/storefront/CustomerReviewsPage';
import { ProductQuickView } from './components/storefront/ProductQuickView';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminPanel } from './components/admin/AdminPanel';
import { Product, Order } from './types';
import { Check, Heart, ArrowLeft } from 'lucide-react';

function AppContent() {
  const { toastMessage, quickViewProduct, setQuickViewProduct, wishlist, products } = useStore();
  const { isAuthenticated } = useAdmin();

  // Navigation pages: 'home' | 'shop' | 'designs' | 'winter' | 'detail' | 'checkout' | 'confirmation' | 'track-order' | 'account' | 'wishlist' | 'admin'
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string>('');
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);

  const handleNavigate = (page: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (page === 'admin') {
      if (isAuthenticated) {
        setCurrentPage('admin');
      } else {
        setShowAdminLoginModal(true);
      }
      return;
    }
    setCurrentPage(page);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (order: Order) => {
    setConfirmedOrder(order);
    setCurrentPage('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTrackOrderFromConfirmation = (orderNum: string) => {
    setTrackingOrderNumber(orderNum);
    setCurrentPage('track-order');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If in admin view and authenticated, show full AdminPanel
  if (currentPage === 'admin' && isAuthenticated) {
    return <AdminPanel onBackToStore={() => setCurrentPage('home')} />;
  }

  const wishlistedItems = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-black selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-neutral-800 text-white text-xs font-mono px-4 py-3 rounded-xs shadow-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header onNavigate={handleNavigate} currentPage={currentPage} />

      {/* Main Content Area */}
      <main className="flex-1 bg-white">
        {currentPage === 'home' && (
          <HomePage
            onSelectProduct={handleSelectProduct}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'shop' && (
          <ShopCatalog
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentPage === 'winter' && (
          <ShopCatalog
            onSelectProduct={handleSelectProduct}
            initialFilterWinter={true}
          />
        )}

        {currentPage === 'designs' && (
          <div className="py-8 bg-neutral-50 min-h-screen">
            <ShopCatalog onSelectProduct={handleSelectProduct} />
          </div>
        )}

        {currentPage === 'detail' && selectedProduct && (
          <ProductDetailPage
            product={selectedProduct}
            onBack={() => handleNavigate('shop')}
            onSelectProduct={handleSelectProduct}
            onCheckoutDirectly={() => handleNavigate('checkout')}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            onOrderSuccess={handleOrderSuccess}
            onBackToShop={() => handleNavigate('shop')}
          />
        )}

        {currentPage === 'confirmation' && confirmedOrder && (
          <OrderConfirmationPage
            order={confirmedOrder}
            onTrackOrder={handleTrackOrderFromConfirmation}
            onContinueShopping={() => handleNavigate('shop')}
          />
        )}

        {currentPage === 'track-order' && (
          <OrderTrackingPage
            initialOrderNumber={trackingOrderNumber}
            onExploreProducts={() => handleNavigate('shop')}
          />
        )}

        {currentPage === 'account' && (
          <CustomerAccountPage
            onTrackOrder={handleTrackOrderFromConfirmation}
            onExploreProducts={() => handleNavigate('shop')}
            onNavigate={handleNavigate}
          />
        )}

        {(currentPage === 'support' || currentPage === 'complaints') && (
          <ComplaintsSupportPage
            onNavigateHome={() => handleNavigate('home')}
            onExploreProducts={() => handleNavigate('shop')}
          />
        )}

        {currentPage === 'policies' && (
          <StorePoliciesPage
            onNavigateHome={() => handleNavigate('home')}
            onExploreProducts={() => handleNavigate('shop')}
          />
        )}

        {currentPage === 'reviews' && (
          <CustomerReviewsPage
            onNavigateHome={() => handleNavigate('home')}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentPage === 'wishlist' && (
          <div className="py-12 bg-neutral-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                <div>
                  <h1 className="text-2xl font-black text-neutral-900 uppercase font-display">
                    Your Wishlist
                  </h1>
                  <p className="text-xs font-mono text-neutral-500">
                    {wishlist.length} saved automotive apparel piece(s)
                  </p>
                </div>
                <button
                  onClick={() => handleNavigate('shop')}
                  className="text-xs font-mono text-neutral-600 hover:text-black flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Explore More</span>
                </button>
              </div>

              {wishlistedItems.length === 0 ? (
                <div className="text-center py-20 bg-white border border-neutral-200 rounded-xs space-y-3 shadow-xs">
                  <Heart className="w-8 h-8 mx-auto text-neutral-400" />
                  <p className="text-xs text-neutral-600">Your wishlist is currently empty.</p>
                  <button
                    onClick={() => handleNavigate('shop')}
                    className="bg-black hover:bg-neutral-800 text-white px-5 py-2.5 text-xs font-bold uppercase rounded-xs cursor-pointer"
                  >
                    Browse Collection
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistedItems.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleSelectProduct(prod)}
                      className="bg-white border border-neutral-200 p-4 rounded-xs cursor-pointer hover:border-black hover:shadow-md transition-all"
                    >
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="aspect-4/3 object-cover rounded-xs mb-3 bg-neutral-100"
                      />
                      <div className="text-[11px] font-mono text-neutral-500">{prod.clothingType}</div>
                      <h3 className="font-semibold text-neutral-900 font-display mt-0.5">{prod.name}</h3>
                      <div className="mt-1 font-mono font-bold text-neutral-900">Rs. {prod.price.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Cart Drawer Slide-over */}
      <CartDrawer
        onProceedToCheckout={() => handleNavigate('checkout')}
        onExploreProducts={() => handleNavigate('shop')}
      />

      {/* Quick View Modal */}
      <ProductQuickView onGoToDetail={handleSelectProduct} />

      {/* Admin Login / Setup Modal */}
      {showAdminLoginModal && (
        <AdminLogin
          onSuccess={() => {
            setShowAdminLoginModal(false);
            setCurrentPage('admin');
          }}
          onClose={() => setShowAdminLoginModal(false)}
        />
      )}

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </AdminProvider>
  );
}

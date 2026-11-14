/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { StoreProvider } from './context/StoreContext';
import { CategoryId, Product } from './types/store';
import { FestiveBanner } from './components/FestiveBanner';
import { AppView, Navbar } from './components/Navbar';
import { StorefrontHero } from './components/StorefrontHero';
import { CatalogSection } from './components/CatalogSection';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer';
import { CustomerOrdersView } from './components/CustomerOrdersView';
import { MessagingDrawer } from './components/MessagingDrawer';
import { AccountModal } from './components/AccountModal';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomGiftBoxModal } from './components/CustomGiftBoxModal';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';

function AppShell() {
  const [currentView, setCurrentView] = useState<AppView>('store');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatProduct, setChatProduct] = useState<Product | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [giftBoxOpen, setGiftBoxOpen] = useState(false);

  const handleNavigate = (view: AppView, category?: 'cadeaux' | 'all') => {
    setCurrentView(view);
    if (category) {
      setSelectedCategory(category);
      if (view === 'store') {
        window.setTimeout(() => {
          document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
        }, 60);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAskAboutProduct = (product: Product) => {
    setChatProduct(product);
    setChatOpen(true);
  };

  return (
    <div
      id="top"
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ backgroundColor: 'var(--canvas)', color: 'var(--ink)' }}
    >
      <FestiveBanner />
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenCart={() => setCartOpen(true)}
        onOpenChat={() => setChatOpen(true)}
        onOpenAccount={() => setAccountOpen(true)}
      />

      <div className="flex-1">
        {currentView === 'store' && (
          <>
            <StorefrontHero
              onExploreCatalog={() =>
                document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })
              }
              onOpenChat={() => setChatOpen(true)}
              onOpenAccount={() => setAccountOpen(true)}
            />
            <CatalogSection
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onSelectProduct={setSelectedProduct}
              onAskAboutProduct={handleAskAboutProduct}
              onOpenGiftBuilder={() => setGiftBoxOpen(true)}
            />
          </>
        )}

        {currentView === 'orders' && (
          <CustomerOrdersView onBackToStore={() => handleNavigate('store', 'all')} />
        )}

        {currentView === 'admin' && (
          <AdminDashboard onBackToStore={() => handleNavigate('store', 'all')} />
        )}
      </div>

      <Footer
        onNavigate={handleNavigate}
        onOpenChat={() => setChatOpen(true)}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAskSeller={handleAskAboutProduct}
      />

      <CustomGiftBoxModal
        open={giftBoxOpen}
        onClose={() => setGiftBoxOpen(false)}
      />

      <CartCheckoutDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onViewOrders={() => handleNavigate('orders')}
      />

      <MessagingDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        attachedProduct={chatProduct}
        onClearAttachedProduct={() => setChatProduct(null)}
      />

      <AccountModal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        onGoAdmin={() => handleNavigate('admin')}
        onGoOrders={() => handleNavigate('orders')}
      />

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}

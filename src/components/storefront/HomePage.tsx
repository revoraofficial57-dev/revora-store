import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { HeroSection } from './HeroSection';
import { DesignExplorer } from './DesignExplorer';
import { ProductCard } from './ProductCard';
import {
  ArrowRight,
  Gauge,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';

interface HomePageProps {
  onSelectProduct: (p: Product) => void;
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectProduct, onNavigate }) => {
  const { products, categories, settings, showToast } = useStore();

  const [newsletterEmail, setNewsletterEmail] = React.useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = React.useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubscribed(true);
    showToast('Subscribed to REVORA Paddock drops!');
  };

  // Curate non-duplicated product subsets
  const featuredProducts = products.filter((p) => p.isFeatured && p.status === 'active').slice(0, 3);
  const winterProducts = products.filter((p) => p.isWinterCollection && p.status === 'active').slice(0, 3);

  return (
    <div className="bg-white text-neutral-900 min-h-screen">
      {/* 1. Hero Banner */}
      {settings.homepageSections.hero && (
        <HeroSection onNavigate={onNavigate} />
      )}

      {/* 2. Core Feature: Design-Based Product Matrix (Multi-silhouette per design) */}
      <DesignExplorer onSelectProduct={onSelectProduct} />

      {/* 3. Featured Collection Grid */}
      {settings.homepageSections.featuredCollection && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-xs font-mono tracking-widest text-neutral-500 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-neutral-900" />
                <span>FEATURED SPEC // REVOLUTION & SPEED</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-black uppercase font-display mt-1">
                Motorsport Streetwear
              </h2>
            </div>
            <button
              onClick={() => onNavigate('shop')}
              className="text-xs font-mono text-neutral-600 hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <span>View All Pieces</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Winter Collection Spec Spotlight */}
      {settings.homepageSections.winterCollection && (
        <section className="py-16 bg-neutral-50 border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <div className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
                  WINTER SPEC // THERMAL PADDOCK
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-black uppercase font-display mt-1">
                  Touge & Winter Apparel
                </h2>
                <p className="text-xs text-neutral-600 mt-1">
                  Heavyweight 450 GSM fleece hoodies, track bomber jackets, and cold-weather knitwear.
                </p>
              </div>

              <button
                onClick={() => onNavigate('winter')}
                className="text-xs font-mono text-neutral-600 hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer group"
              >
                <span>View Full Winter Spec</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {winterProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onSelectProduct={onSelectProduct}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Clothing Categories Carousel / Grid */}
      {settings.homepageSections.categories && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-neutral-200">
          <div className="mb-8">
            <div className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
              UNIVERSAL APPAREL CUTS
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-black uppercase font-display mt-1">
              Shop By Clothing Type
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat) => (
              <div
                key={cat.id}
                onClick={() => onNavigate('shop')}
                className="group relative aspect-4/3 bg-neutral-100 border border-neutral-200 hover:border-black rounded-xs overflow-hidden cursor-pointer transition-all flex flex-col justify-end p-4 shadow-xs"
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-200" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative z-10">
                  <h3 className="font-bold text-white uppercase font-display text-sm">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] font-mono text-neutral-300 mt-0.5">
                    {cat.itemCount} items ready
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Why Revora (Craftsmanship & Anti-Slop Values) */}
      {settings.homepageSections.whyRevora && (
        <section className="py-16 bg-neutral-50 border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
              <div className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
                THE AUTOMOTIVE STREETWEAR STANDARD
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-black uppercase font-display">
                Engineered For Those Who Live The Drive
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed">
                REVORA bridges high-performance automotive engineering culture with luxury streetwear tailoring in Pakistan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white border border-neutral-200 rounded-xs space-y-3 shadow-xs">
                <Gauge className="w-6 h-6 text-black" />
                <h3 className="font-bold text-black uppercase font-display text-base">
                  450 GSM Heavy Combed Cotton
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Our heavyweight brushed fleece hoodies and loopback crewnecks maintain structured streetwear drape and never lose shape after repeated wash cycles.
                </p>
              </div>

              <div className="p-6 bg-white border border-neutral-200 rounded-xs space-y-3 shadow-xs">
                <Layers className="w-6 h-6 text-black" />
                <h3 className="font-bold text-black uppercase font-display text-base">
                  Multi-Silhouette Design Matrices
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Every car enthusiast design is engineered across distinct apparel cuts — regular tees, oversized drops, hoodies, sweatshirts, jackets, and sweaters.
                </p>
              </div>

              <div className="p-6 bg-white border border-neutral-200 rounded-xs space-y-3 shadow-xs">
                <ShieldCheck className="w-6 h-6 text-black" />
                <h3 className="font-bold text-black uppercase font-display text-base">
                  Direct Payment & Fast Transit
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Support for Cash on Delivery, instant Meezan Bank/Alfalah verification, and express delivery to Lahore, Karachi, Islamabad, and nationwide.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. Promotional Newsletter / Paddock Access */}
      {settings.homepageSections.newsletter && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
              THE REVORA PADDOCK
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-black uppercase font-display">
              Join the Paddock Crew
            </h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Get notified of limited midnight drops, track day apparel capsules, and private promo codes.
            </p>

            {newsletterSubscribed ? (
              <div className="p-4 bg-neutral-900 border border-neutral-800 text-white text-xs font-mono rounded-xs">
                Welcome to the REVORA paddock crew. Use code <strong className="text-emerald-400">REVORA10</strong> at checkout for 10% off.
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2 pt-2">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className="flex-1 bg-white border border-neutral-300 text-xs px-4 py-3 rounded-xs text-neutral-900 placeholder-neutral-400 font-mono focus:outline-none focus:border-black"
                />
                <button
                  type="submit"
                  className="bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xs cursor-pointer font-display transition-colors"
                >
                  Join
                </button>
              </form>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Check, Shield, Zap, Sparkles, ArrowRight } from 'lucide-react';
import { ProductItem } from '../../types';
import { CheckoutModal } from './CheckoutModal';

export const ProductsScreen: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [duration, setDuration] = useState<'30 Days' | '60 Days' | 'Lifetime'>('30 Days');

  const products: ProductItem[] = [
    {
      id: 'bronze',
      name: 'Bronze Suite',
      tagline: 'Essential security & baseline tooling',
      price: '$15.00',
      period: '/month',
      badge: 'Starter',
      accentColor: 'from-amber-600 to-amber-700',
      features: [
        'Single device HWID license',
        'Standard panel security injection',
        'Direct cloud updates & patches',
        'Community Discord support access',
        '99.5% guaranteed server availability',
      ],
    },
    {
      id: 'silver',
      name: 'Silver Pro',
      tagline: 'Advanced diagnostic & automation framework',
      price: '$25.00',
      period: '/month',
      badge: 'Popular',
      popular: true,
      accentColor: 'from-slate-400 to-slate-500',
      features: [
        'Multi-device roaming HWID license',
        'Priority low-latency server cluster',
        'Encrypted local configuration storage',
        'Rapid ticket dispatch & priority support',
        'Automatic zero-day update delivery',
        'Extended telemetry diagnostics',
      ],
    },
    {
      id: 'gold-vip',
      name: 'Gold VIP Plan',
      tagline: 'Elite tier with maximum stealth & dedicated speed',
      price: '$45.00',
      period: '/month',
      badge: 'VIP Elite',
      accentColor: 'from-amber-400 to-yellow-600',
      features: [
        'Dual active HWID simultaneous slots',
        'Dedicated high-throughput proxy relays',
        'Direct developer private channel access',
        'Custom feature prioritization requests',
        'Hardware-level bypass engine',
        'Full historical audit logs',
      ],
    },
    {
      id: 'platinum',
      name: 'Platinum Enterprise',
      tagline: 'Unrestricted enterprise capabilities & private nodes',
      price: '$80.00',
      period: '/month',
      badge: 'Enterprise',
      accentColor: 'from-cyan-400 to-blue-600',
      features: [
        'Unlimited device floating licenses',
        'Isolated private backend micro-node',
        'Custom security signature generation',
        'Direct 1-on-1 engineer assistance',
        'Real-time API access keys',
        'SLA 99.99% contract backing',
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 pb-8 text-slate-100 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121623] to-[#0c0f18] border border-[#232c45]">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Products & Subscription Tiers</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Select a tailored subscription tier. Every purchase includes immediate backend provisioning, automatic key generation upon approval, and continuous server updates.
        </p>

        {/* Duration Selector Tabs */}
        <div className="mt-3 p-1 rounded-xl bg-[#0b0e17] border border-[#1e2538] flex items-center gap-1">
          {(['30 Days', '60 Days', 'Lifetime'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                duration === d
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards */}
      <div className="flex flex-col gap-3.5">
        {products.map((product) => {
          const isPop = product.popular;

          return (
            <div
              key={product.id}
              className={`relative rounded-2xl bg-[#131724] border overflow-hidden transition-all duration-200 ${
                isPop
                  ? 'border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                  : 'border-[#21283d] hover:border-slate-700'
              }`}
            >
              {isPop && (
                <div className="absolute top-0 right-0 px-3 py-0.5 bg-gradient-to-l from-cyan-500 to-blue-600 text-slate-950 text-[10px] font-extrabold uppercase rounded-bl-xl tracking-wider">
                  Recommended
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-cyan-300 font-semibold border border-slate-700/60">
                      {product.badge}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5">{product.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{product.tagline}</p>
                  </div>
                </div>

                {/* Price Display */}
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{product.price}</span>
                  <span className="text-xs text-slate-400">{product.period}</span>
                </div>

                {/* Features List */}
                <div className="mt-3.5 pt-3 border-t border-[#1e2538] flex flex-col gap-1.5">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Order Button */}
                <button
                  onClick={() => setSelectedProduct(product)}
                  className={`w-full py-2.5 mt-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all ${
                    isPop
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:brightness-110 shadow-md shadow-cyan-500/20'
                      : 'bg-[#1a2033] hover:bg-[#20273d] text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  <span>Select & Order</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Modal Sheet */}
      {selectedProduct && (
        <CheckoutModal
          product={selectedProduct}
          duration={duration}
          onClose={() => setSelectedProduct(null)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

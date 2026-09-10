import React, { useState } from 'react';
import { X, CheckCircle2, Shield, Loader2, AlertCircle, Copy, Check } from 'lucide-react';
import { ProductItem } from '../../types';
import { submitCheckout } from '../../services/api';

interface Props {
  product: ProductItem;
  duration: string;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export const CheckoutModal: React.FC<Props> = ({ product, duration, onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'crypto_usdt' | 'crypto_btc' | 'paypal'>(
    'crypto_usdt'
  );
  const [txHash, setTxHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{ orderId: string; message: string } | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const hwid = 'ANDROID-SM-S928B-DSC';
  const paymentAddresses = {
    crypto_usdt: '0x71C...DarkSkullUSDT_TRC20',
    crypto_btc: 'bc1q...DarkSkullVaultBTC',
    paypal: 'billing@darkskullcorp.com',
  };

  const calculatePrice = () => {
    const base = parseFloat(product.price.replace('$', ''));
    if (duration === '60 Days') return `$${(base * 1.8).toFixed(2)}`;
    if (duration === 'Lifetime') return `$${(base * 4.5).toFixed(2)}`;
    return product.price;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Please enter your account username.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid contact email.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await submitCheckout({
      product: product.name,
      plan: `${product.name} (${duration})`,
      price: calculatePrice(),
      duration,
      username: username.trim(),
      email: email.trim(),
      hwid,
      paymentMethod,
      txHash: txHash.trim() || undefined,
    });

    setIsSubmitting(false);

    if (res.success && res.orderId) {
      setOrderResult({ orderId: res.orderId, message: res.message });
      onSuccess(res.orderId);
    } else {
      setErrorMessage(res.message || 'Failed to submit order. Please retry.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#121623] border border-[#262e45] p-5 shadow-2xl text-slate-100 flex flex-col gap-4 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#20273c]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Order Checkout</h3>
              <p className="text-[11px] text-cyan-400 font-mono">
                {product.name} • {duration}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {orderResult ? (
          /* Success Receipt View */
          <div className="flex flex-col items-center text-center gap-3 py-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white">Order Placed Successfully!</h4>
            <p className="text-xs text-slate-300 max-w-xs">{orderResult.message}</p>

            <div className="w-full p-3 rounded-xl bg-[#181e30] border border-[#27324d] text-left text-xs flex flex-col gap-1.5 mt-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Order Reference:</span>
                <span className="font-mono font-bold text-cyan-400">{orderResult.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Plan:</span>
                <span className="font-medium text-slate-200">
                  {product.name} ({duration})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Price:</span>
                <span className="font-bold text-emerald-400">{calculatePrice()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-semibold">
                  Pending Verification
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-1">
              Your license key will be granted and visible under your User Dashboard as soon as the admin confirms transaction verification.
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all"
            >
              Done & Return to App
            </button>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Price Banner */}
            <div className="p-3 rounded-xl bg-[#181d2c] border border-[#262f47] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Total Amount Due
                </span>
                <div className="text-lg font-extrabold text-cyan-400">{calculatePrice()}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-300 font-mono">
                {duration}
              </span>
            </div>

            {/* User Input Fields */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Account Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username to attach plan"
                required
                className="w-full px-3 py-2 rounded-lg bg-[#181d2c] border border-[#2b354f] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Notification Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Where to send order updates"
                required
                className="w-full px-3 py-2 rounded-lg bg-[#181d2c] border border-[#2b354f] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Device Hardware ID (HWID)</label>
              <input
                type="text"
                value={hwid}
                readOnly
                className="w-full px-3 py-2 rounded-lg bg-[#141824] border border-[#22293d] text-xs text-slate-400 font-mono cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-500">
                Bound to this Android device client instance.
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Payment Gateway</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'crypto_usdt' as const, label: 'USDT (TRC20)' },
                  { id: 'crypto_btc' as const, label: 'Bitcoin' },
                  { id: 'paypal' as const, label: 'PayPal' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-2 px-1.5 rounded-lg border text-xs font-medium transition-all ${
                      paymentMethod === m.id
                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                        : 'border-[#262e45] bg-[#171c2b] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Instructions & Address */}
            <div className="p-3 rounded-xl bg-[#151928] border border-[#232c45] text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Send {calculatePrice()} to:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(paymentAddresses[paymentMethod])}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                >
                  {copiedAddress ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-slate-200 break-all p-2 rounded bg-[#0f121d] border border-[#1e253b]">
                {paymentAddresses[paymentMethod]}
              </div>
            </div>

            {/* Transaction Proof Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Payment Proof / TX Hash (Optional)
              </label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Paste transaction reference / txid"
                className="w-full px-3 py-2 rounded-lg bg-[#181d2c] border border-[#2b354f] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting to DSC Backend...</span>
                </>
              ) : (
                <span>Confirm & Place Order</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingAPI, authAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { BillingPlan, BillingSubscription, EnterpriseInfo } from '../types';
import { Check, Zap, Building2, ArrowLeft, Loader2, Star, AlertCircle, X } from 'lucide-react';

// Extend window for Razorpay SDK
declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function BillingPage() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuthStore();

    const [plans, setPlans] = useState<BillingPlan[]>([]);
    const [enterprise, setEnterprise] = useState<EnterpriseInfo | null>(null);
    const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [upgrading, setUpgrading] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    // Enterprise form
    const [showEnterprise, setShowEnterprise] = useState(false);
    const [entForm, setEntForm] = useState({
        name: user?.name ?? '',
        email: user?.email ?? '',
        company: '',
        phone: '',
        employees: '11-50',
        message: '',
    });
    const [sendingEnterprise, setSendingEnterprise] = useState(false);

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    const loadData = useCallback(async () => {
        setLoadingPlans(true);
        try {
            const [plansRes, subRes] = await Promise.all([
                billingAPI.getPlans(),
                billingAPI.getSubscription().catch(() => null),
            ]);
            setPlans(plansRes.data?.data?.plans ?? []);
            setEnterprise(plansRes.data?.data?.enterprise ?? null);
            if (subRes) setSubscription(subRes.data?.data ?? null);
        } catch {
            showToast('error', 'Failed to load billing information.');
        } finally {
            setLoadingPlans(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleUpgrade = async (plan: 'PRO' | 'BUSINESS') => {
        if (!user) { navigate('/login'); return; }
        setUpgrading(plan);
        try {
            const orderRes = await billingAPI.createOrder(plan);
            const order = orderRes.data?.data;
            if (!order?.orderId) throw new Error('Failed to create order');

            const rzp = new window.Razorpay({
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                order_id: order.orderId,
                name: 'PDFify',
                description: `Upgrade to ${order.planName}`,
                theme: { color: '#6366f1' },
                prefill: { name: user.name ?? '', email: user.email },

                handler: async (response: any) => {
                    try {
                        const verifyRes = await billingAPI.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan,
                        });
                        if (verifyRes.data?.success) {
                            // Refresh user profile so new plan is reflected everywhere
                            const profileRes = await authAPI.getProfile();
                            const freshUser = profileRes.data?.user;
                            if (freshUser) updateUser(freshUser);
                            await loadData();
                            showToast('success', `You are now on the ${order.planName} plan!`);
                        }
                    } catch {
                        showToast('error', 'Payment verification failed. Contact support.');
                    } finally {
                        setUpgrading(null);
                    }
                },

                modal: {
                    ondismiss: () => setUpgrading(null),
                },
            });
            rzp.open();
        } catch {
            showToast('error', 'Failed to initiate payment. Please try again.');
            setUpgrading(null);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Downgrade to FREE plan? You will lose PRO/BUSINESS features immediately.')) return;
        setCancelling(true);
        try {
            await billingAPI.cancelSubscription();
            const profileRes = await authAPI.getProfile();
            const freshUser = profileRes.data?.user;
            if (freshUser) updateUser(freshUser);
            await loadData();
            showToast('success', 'Subscription cancelled. You are now on the FREE plan.');
        } catch {
            showToast('error', 'Failed to cancel subscription.');
        } finally {
            setCancelling(false);
        }
    };

    const handleEnterpriseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSendingEnterprise(true);
        try {
            await billingAPI.enterpriseContact(entForm);
            showToast('success', "Thanks! We'll reach out within 1 business day.");
            setShowEnterprise(false);
            setEntForm(prev => ({ ...prev, company: '', phone: '', employees: '11-50', message: '' }));
        } catch {
            showToast('error', 'Failed to send enquiry. Please try again.');
        } finally {
            setSendingEnterprise(false);
        }
    };

    const currentPlan = user?.subscription?.plan ?? 'FREE';
    const planIconMap: Record<string, React.ReactNode> = {
        FREE: <Star className="w-8 h-8 text-slate-500" />,
        PRO: <Zap className="w-8 h-8 text-indigo-500" />,
        BUSINESS: <Building2 className="w-8 h-8 text-purple-500" />,
    };

    const planGradient: Record<string, string> = {
        FREE: 'from-slate-400 to-slate-500',
        PRO: 'from-indigo-500 to-blue-600',
        BUSINESS: 'from-purple-600 to-fuchsia-700',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl text-white text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.msg}
                    <button onClick={() => setToast(null)}><X className="w-4 h-4" /></button>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 py-10">
                {/* Back */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Dashboard
                </button>

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        Billing &amp; Plans
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Choose the plan that fits your workflow. Upgrade or downgrade at any time.
                    </p>
                </div>

                {/* Current subscription card */}
                {subscription && currentPlan !== 'FREE' && (
                    <div className={`mb-10 bg-gradient-to-r ${planGradient[currentPlan]} text-white rounded-2xl p-6 flex items-center justify-between shadow-lg`}>
                        <div>
                            <p className="text-white/80 text-sm font-medium mb-1">Current Plan</p>
                            <h2 className="text-2xl font-bold">{currentPlan}</h2>
                            {subscription.currentPeriodEnd && (
                                <p className="text-white/80 text-sm mt-1">
                                    Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    {subscription.daysRemaining !== undefined && ` · ${subscription.daysRemaining} days remaining`}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Cancel Subscription
                        </button>
                    </div>
                )}

                {/* Plan cards */}
                {loadingPlans ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        {plans.map((plan) => {
                            const isCurrent = plan.id === currentPlan;
                            const isPopular = plan.popular;
                            const canUpgrade = plan.id !== 'FREE' && !isCurrent;

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:-translate-y-1 flex flex-col ${
                                        isCurrent ? 'ring-2 ring-green-500' : ''
                                    } ${isPopular ? 'ring-2 ring-indigo-500 shadow-indigo-200/60 shadow-xl' : ''}`}
                                >
                                    {/* Top banner — always reserve the same height slot */}
                                    {(isPopular || isCurrent) ? (
                                        <div className={`text-white text-xs font-bold text-center py-2 tracking-widest ${
                                            isCurrent
                                                ? 'bg-green-500'
                                                : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                        }`}>
                                            {isCurrent ? 'CURRENT PLAN' : 'MOST POPULAR'}
                                        </div>
                                    ) : (
                                        // Invisible spacer keeps all cards aligned
                                        <div className="py-2 invisible text-xs">placeholder</div>
                                    )}

                                    <div className="px-7 pt-6 pb-7 flex flex-col flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            {planIconMap[plan.id] ?? <Star className="w-8 h-8" />}
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider">{plan.id}</p>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            {plan.price === 0 ? (
                                                <span className="text-4xl font-extrabold text-slate-800">Free</span>
                                            ) : (
                                                <>
                                                    <span className="text-2xl font-semibold text-slate-500">₹</span>
                                                    <span className="text-4xl font-extrabold text-slate-800">{plan.price}</span>
                                                    <span className="text-slate-500 text-sm">/{plan.billingPeriod}</span>
                                                </>
                                            )}
                                        </div>

                                        <ul className="space-y-2.5 mb-8 flex-1">
                                            {plan.features.map((feat, i) => (
                                                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                                                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    {feat}
                                                </li>
                                            ))}
                                        </ul>

                                        {canUpgrade ? (
                                            <button
                                                onClick={() => handleUpgrade(plan.id as 'PRO' | 'BUSINESS')}
                                                disabled={upgrading !== null}
                                                className={`w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${planGradient[plan.id]} hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg`}
                                            >
                                                {upgrading === plan.id ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                                                ) : (
                                                    <>Upgrade to {plan.name} →</>
                                                )}
                                            </button>
                                        ) : isCurrent ? (
                                            <div className="w-full py-3 rounded-xl font-semibold text-center bg-slate-100 text-slate-500 text-sm">
                                                Your Current Plan
                                            </div>
                                        ) : (
                                            <div className="w-full py-3 rounded-xl font-semibold text-center bg-slate-100 text-slate-400 text-sm">
                                                Included
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Feature comparison note */}
                <div className="bg-white rounded-2xl shadow p-6 mb-12 text-sm text-slate-600">
                    <h3 className="font-semibold text-slate-800 mb-3">What's included in every plan</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> PDF Merge, Compress & Split</div>
                        <div className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Digital Signature upload & placement</div>
                        <div className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> PDF text & shape editor</div>
                        <div className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Secure GCS file storage</div>
                        <div className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Version history</div>
                        <div className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Basic AI Classify &amp; Summarize (FREE)</div>
                    </div>
                </div>

                {/* Enterprise section */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl p-8 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">
                                {enterprise?.name ?? 'Enterprise'}
                            </h2>
                            <p className="text-slate-300 mb-4">
                                {enterprise?.description ?? 'Custom pricing for large organisations'}
                            </p>
                            {enterprise?.highlights && (
                                <ul className="grid sm:grid-cols-2 gap-2">
                                    {enterprise.highlights.map((h, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                            <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                            {h}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            onClick={() => setShowEnterprise(true)}
                            className="flex-shrink-0 px-8 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors shadow-lg"
                        >
                            Contact Sales →
                        </button>
                    </div>
                </div>
            </div>

            {/* Enterprise contact modal */}
            {showEnterprise && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-slate-800">Enterprise Enquiry</h2>
                            <button
                                onClick={() => setShowEnterprise(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleEnterpriseSubmit} className="p-6 space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Name *</label>
                                    <input
                                        required
                                        value={entForm.name}
                                        onChange={e => setEntForm(p => ({ ...p, name: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        placeholder="Rahul Sharma"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Work Email *</label>
                                    <input
                                        required
                                        type="email"
                                        value={entForm.email}
                                        onChange={e => setEntForm(p => ({ ...p, email: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        placeholder="rahul@company.com"
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
                                    <input
                                        required
                                        value={entForm.company}
                                        onChange={e => setEntForm(p => ({ ...p, company: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        placeholder="Acme Corp"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input
                                        value={entForm.phone}
                                        onChange={e => setEntForm(p => ({ ...p, phone: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        placeholder="+91-9876543210"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Company Size *</label>
                                <select
                                    required
                                    value={entForm.employees}
                                    onChange={e => setEntForm(p => ({ ...p, employees: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                >
                                    <option value="1-10">1–10 employees</option>
                                    <option value="11-50">11–50 employees</option>
                                    <option value="51-200">51–200 employees</option>
                                    <option value="201-1000">201–1,000 employees</option>
                                    <option value="1000+">1,000+ employees</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={entForm.message}
                                    onChange={e => setEntForm(p => ({ ...p, message: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                                    placeholder="Tell us about your use case…"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={sendingEnterprise}
                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {sendingEnterprise ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send Enquiry'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

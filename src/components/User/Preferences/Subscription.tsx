import React, { useEffect, useState, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

type Interval = 'month' | 'year';

interface ProductWithPrices {
    id: string;
    name: string;
    description?: string;
    prices: Array<{
        id: string;
        unit_amount: number; // cents
        currency: string;
    active?: boolean;
        recurring?: { interval?: Interval };
    }>;
}

const Subscription: React.FC = () => {
    const { currentUser } = useAuth();
    const [hasSub, setHasSub] = useState(false);
    const [subName, setSubName] = useState<string | null>(null);
    const [subCancel, setSubCancel] = useState<boolean>(false);
    const [subExpiry, setSubExpiry] = useState<string | null>(null);
    const [subPrice, setSubPrice] = useState<string | null>(null);
    // Product selection state when user has no active sub
    const [products, setProducts] = useState<ProductWithPrices[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [productsError, setProductsError] = useState<string | null>(null);
    const [interval, setInterval] = useState<Interval>('year');
    const [creatingCheckout, setCreatingCheckout] = useState<string | null>(null); // priceId in progress

    useEffect(() => {
        if (!currentUser) return;
        const getSubscription = async () => {
            try {
                const subscriptionsQuery = query(
                    collection(db, 'customers', currentUser.uid, 'subscriptions'),
                    where('status', 'in', ['active', 'trialing'])
                );
                const querySnapshot = await getDocs(subscriptionsQuery);
                if (querySnapshot.empty) {
                    setHasSub(false);
                    return;
                }
                const subscriptionData: any = querySnapshot.docs[0].data();
                setSubName(subscriptionData.items[0].price.product.name);
                setSubExpiry(subscriptionData.current_period_end.toDate().toLocaleDateString());
                setSubPrice((subscriptionData.items[0].price.unit_amount / 100).toFixed(2));
                setSubCancel(subscriptionData.cancel_at_period_end);
                setHasSub(true);
            } catch (e) {
                // If subscription fetch fails, treat as no sub so user can attempt purchase
                setHasSub(false);
            }
        };
        getSubscription();
    }, [currentUser]);

    // Fetch products/prices only if user lacks active subscription
    useEffect(() => {
        if (hasSub || !currentUser) return;
        let active = true;
        const fetchProducts = async () => {
            try {
                setLoadingProducts(true);
                const productsQuery = query(collection(db, 'products'), where('active', '==', true));
                const productSnap = await getDocs(productsQuery);
                const productDocs = productSnap.docs;
                const productResults: ProductWithPrices[] = [];
                for (const p of productDocs) {
                    const data: any = p.data();
                    const pricesSnap = await getDocs(collection(p.ref, 'prices'));
                    const prices: ProductWithPrices['prices'] = [];
                    pricesSnap.forEach(priceDoc => {
                        const price: any = priceDoc.data();
                        // Only include active prices (Stripe extension stores 'active' flag on price docs)
                        if (price.active) {
                            prices.push({
                                id: priceDoc.id,
                                unit_amount: price.unit_amount,
                                currency: price.currency,
                                active: price.active,
                                recurring: price.recurring
                            });
                        }
                    });
                    productResults.push({ id: p.id, name: data.name, description: data.description, prices });
                }
                if (active) {
                    setProducts(productResults);
                    setProductsError(null);
                }
            } catch (e: any) {
                if (active) setProductsError(e?.message || 'Failed to load subscriptions');
            } finally {
                if (active) setLoadingProducts(false);
            }
        };
        fetchProducts();
        return () => { active = false; };
    }, [hasSub, currentUser]);

    const productsForInterval = useMemo(() => {
        return products.map(p => {
            const price = p.prices.find(pr => pr.recurring?.interval === interval) || p.prices[0];
            return { product: p, price };
        }).filter(entry => !!entry.price);
    }, [products, interval]);

    const toggleInterval = () => setInterval(prev => prev === 'month' ? 'year' : 'month');

    const startCheckout = async (priceId: string) => {
        if (!currentUser || !priceId) return;
        
        try {
            setCreatingCheckout(priceId);
            const docRef = await addDoc(
                collection(db, 'customers', currentUser.uid, 'checkout_sessions'),
                {
                    price: priceId,
                    allow_promotion_codes: true,
                    success_url: window.location.href,
                    cancel_url: window.location.href
                }
            );
            onSnapshot(docRef, (snap) => {
                const data = snap.data();
                const url = (data as any)?.url;
                const error = (data as any)?.error;
                if (error) {
                    alert(`An error occurred: ${error.message}`);
                    setCreatingCheckout(null);
                }
                if (url) window.location.assign(url);
            });
        } catch (e: any) {
            alert(e?.message || 'Failed to start checkout');
            setCreatingCheckout(null);
        }
    };

    if (hasSub) {
        return (
            <div className="flex flex-col gap-4 border border-gray-300 px-4 py-4 rounded-lg">
                <div className="flex flex-row gap-3 justify-between items-center">
                    <div className='flex flex-col'>
                        <div className="text-xl font-bold text-slate-600 leading-snug">{subName}</div>
                        <div className="text-sm text-slate-600">
                            {subCancel
                                ? `Your subscription will expire on ${subExpiry}`
                                : `Renews on ${subExpiry} for $${subPrice} + tax`}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => window.location.href = 'https://billing.stripe.com/p/login/test_9B68wP2xjb5C7XT4teak000'}
                        className="h-min group flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                    >
                        <span>Manage</span>
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 border border-gray-300 px-4 py-4 rounded-lg">
            <div className="flex flex-col gap-1">
                <div className="text-xl font-bold text-slate-600 leading-snug">Choose a Plan</div>
            </div>
            <div className="flex items-center gap-2 self-start text-sm font-medium">
                <span className={interval === 'month' ? 'text-slate-900' : 'text-slate-300'}>Monthly</span>
                <button
                    type="button"
                    onClick={toggleInterval}
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-300 transition-colors focus:outline-none"
                    aria-label="Toggle billing interval"
                >
                    <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${interval === 'year' ? 'translate-x-5' : 'translate-x-1'}`}
                    />
                </button>
                <span className={interval === 'year' ? 'text-slate-900' : 'text-slate-300'}>Annual</span>
            </div>
            {loadingProducts && productsForInterval.length === 0 && (
                <div className="text-sm text-slate-500">Loading options...</div>
            )}
            {!loadingProducts && productsError && (
                <div className="text-sm text-red-600">{productsError}</div>
            )}
            {!loadingProducts && !productsError && productsForInterval.length === 0 && (
                <div className="text-sm text-slate-500">No subscription options available.</div>
            )}
            <div className="flex flex-col divide-y border rounded-md overflow-hidden">
                {productsForInterval.map(({ product, price }) => {
                    const displayAmount = (price.unit_amount / 100).toFixed(2);
                    return (
                        <div key={product.id + price.id} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-slate-800">{product.name}</div>
                                {product.description && (
                                    <div className="text-xs text-slate-500 line-clamp-2">{product.description}</div>
                                )}
                            </div>
                            <div className="flex items-center gap-6 md:justify-end">
                                <div className="text-slate-700 text-sm font-medium whitespace-nowrap">${displayAmount} {price.currency?.toUpperCase()} {price.recurring?.interval ? ` / ${price.recurring.interval}` : ''}</div>
                                <button
                                    type="button"
                                    disabled={creatingCheckout === price.id}
                                    onClick={() => startCheckout(price.id)}
                                    className="px-4 py-2 rounded-md slate-gradient text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    {creatingCheckout === price.id ? 'Redirecting…' : 'Subscribe'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Subscription;
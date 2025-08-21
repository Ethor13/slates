import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../../lib/firebase';

const MONTHLY_PRICE_ID = 'price_1RyOQgFagUxb9SivZJuqRrO0';
const YEARLY_PRICE_ID = 'price_1RyOQgFagUxb9Siv1hTr375a';

const Subscription: React.FC = () => {
    const { currentUser } = useAuth();
    const [subName, setSubName] = useState<string | null>(null);
    const [subCancel, setSubCancel] = useState<boolean>(false);
    const [subExpiry, setSubExpiry] = useState<string | null>(null);
    const [subStatus, setSubStatus] = useState<string | null>(null); // active | trialing | null
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
                if (querySnapshot.empty) return;

                const subscriptionData: any = querySnapshot.docs[0].data();
                setSubName(subscriptionData.items[0].price.product.name);
                setSubStatus(subscriptionData.status);
                if (subStatus == "trialing") {
                    setSubExpiry(subscriptionData.trial_end.toDate().toLocaleDateString());
                } else {
                    setSubExpiry(subscriptionData.current_period_end.toDate().toLocaleDateString());
                }
                setSubCancel(subscriptionData.cancel_at_period_end);
            } catch (e) {
                // If subscription fetch fails, treat as no sub so user can attempt purchase
            }
        };
        getSubscription();
    }, [currentUser]);

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

    const manageSub = async () => {
        setCreatingCheckout("manage_subscription");
        const functions = getFunctions();
        const createPortalLink = httpsCallable(functions, 'ext-firestore-stripe-payments-createPortalLink');
        const { data } = await createPortalLink({ returnUrl: window.location.href });
        window.location.assign((data as any).url);
        setCreatingCheckout(null);
    };

    return (
        <div className="flex flex-col gap-4 border border-gray-300 px-4 py-4 rounded-lg">
            <div className="flex flex-row gap-3 justify-between items-center">
                <div className='flex flex-col'>
                    <div className="text-xl font-bold text-slate-600 leading-snug">{subStatus === 'active' ? subName : subStatus === "trialing" ? `Free Trial ends on ${subExpiry}` : "No Active Subscription Found"}</div>
                    <div className="text-sm text-slate-600">
                        {
                            subStatus === 'trialing'
                                ? "Manage your plan to continue your subscription at the end of the free trial"
                                : subCancel
                                    ? `Your subscription will expire on ${subExpiry}`
                                    : subExpiry
                                        ? `Renews on ${subExpiry}`
                                        : "Manage your plan to activate your subscription"
                        }
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => { subStatus === 'active' || subStatus === 'trialing' ?  manageSub() : startCheckout(YEARLY_PRICE_ID) }}
                        className={`h-min group flex justify-center items-center gap-2 text-sm font-medium text-slate-700 hover:bg-slate-light/20 py-1 px-2 rounded-full ${creatingCheckout && creatingCheckout != MONTHLY_PRICE_ID ? "bg-slate-light/50 animate-pulse pointer-events-none" : ""}`}
                    >
                        <span>{creatingCheckout && creatingCheckout != MONTHLY_PRICE_ID ? "Redirecting..." : subStatus === 'active' ? 'Manage' : subStatus === "trialing" ? "Start a Subscription" : 'Start a Yearly Subscription'}</span>
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                    {
                        subStatus !== "active" && subStatus !== "trialing" && (
                            <button
                                type="button"
                                onClick={() => startCheckout(MONTHLY_PRICE_ID) }
                                className={`h-min group flex items-center justify-center gap-2 text-sm font-medium text-slate-700 hover:bg-slate-light/20 py-1 px-2 rounded-full ${creatingCheckout && creatingCheckout == MONTHLY_PRICE_ID ? "bg-slate-light/50 animate-pulse pointer-events-none" : ""}`}
                            >
                                <span>{creatingCheckout && creatingCheckout == MONTHLY_PRICE_ID ? "Redirecting..." : subStatus === 'active' ? 'Manage' : 'Start a Monthly Subscription'}</span>
                                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                            </button>
                        )
                    }
                </div>
            </div>
        </div>
    );
};

export default Subscription;
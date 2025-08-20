import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const Subscription: React.FC = () => {
    const { currentUser } = useAuth();
    const [hasSub, setHasSub] = useState(false);
    const [subName, setSubName] = useState<string | null>(null);
    const [subCancel, setSubCancel] = useState<boolean>(false);
    const [subExpiry, setSubExpiry] = useState<string | null>(null);
    const [subPrice, setSubPrice] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser) return;

        const getSubscription = async () => {
            const subscriptionsQuery = query(
                collection(
                    db,
                    "customers",
                    currentUser.uid,
                    "subscriptions",
                ),
                where("status", "in", ["active", "trialing"])
            );

            const querySnapshot = await getDocs(subscriptionsQuery);
            const subscriptionData = querySnapshot.docs[0].data();

            setSubName(subscriptionData.items[0].price.product.name);
            setSubExpiry(subscriptionData.current_period_end.toDate().toLocaleDateString());
            setSubPrice((subscriptionData.items[0].price.unit_amount / 100).toFixed(2));
            setSubCancel(subscriptionData.cancel_at_period_end);
            setHasSub(true);
        };

        getSubscription();

    }, [currentUser]);

    return hasSub ? (
        <div className="flex flex-row gap-3 justify-between items-center border border-gray-300 px-4 py-2 rounded-lg">
            <div className='flex flex-col'>
                <div className="text-xl font-bold text-slate-600 leading-snug">
                    {subName}
                </div>
                <div>{
                    subCancel
                        ? `Your subscription will expire on ${subExpiry}`
                        : `Your subscription is set to renew on ${subExpiry} for ${subPrice} + tax`
                }
                </div>
            </div>
            <button
                type="button"
                onClick={() => window.location.href = 'https://billing.stripe.com/p/login/test_9B68wP2xjb5C7XT4teak000'}
                className="h-min group w-full md:w-auto flex items-center justify-between md:justify-start gap-2 text-sm font-medium text-gray-7000 pr-2"
            >
                <span>Manage subscription</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </button>
        </div>
    ) : (
        <div className="flex flex-row gap-3 justify-between items-center border border-gray-300 px-4 py-2 rounded-lg">
            <div className='flex flex-col'>
                <div className="text-xl font-bold text-slate-600 leading-snug">
                    No Active Subscriptions
                </div>
                <div>Subscriptions are available in monthly and yearly plans</div>
            </div>
            <button
                type="button"
                onClick={() => window.location.href = '/manage-subscription'}
                className="h-min group w-full md:w-auto flex items-center justify-between md:justify-start gap-2 text-sm font-medium text-gray-7000 pr-2"
            >
                <span>Start a subscription</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </button>
        </div>

    );
};

export default Subscription;
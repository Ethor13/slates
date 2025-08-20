import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from "../../lib/firebase";
import { User } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';

const startCheckout = async (user: User | null, priceId: string | undefined) => {
    if (!user || !priceId) return;

    const docRef = await addDoc(
        collection(db, "customers", user.uid, "checkout_sessions"),
        {
            price: priceId,
            success_url: window.location.href,
            cancel_url: window.location.href,
        }
    );

    onSnapshot(docRef, (snap) => {
        const data = snap.data();
        if (!data) return;
        const { error, url } = data as any;
        if (error) alert(`An error occured: ${error.message}`);
        if (url) window.location.assign(url);
    });
};

type PriceOption = {
    productId: string;
    productName: string;
    priceId: string;
    amount: number; // dollars
    currency: string;
    interval?: string;
};

export default function ManageSubscription() {
    const [message, setMessage] = useState("");
    const [priceOptions, setPriceOptions] = useState<PriceOption[]>([]);
    const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const { currentUser } = useAuth();

    useEffect(() => {
        // Check to see if this is a redirect back from Checkout
        const query = new URLSearchParams(window.location.search);

        if (query.get("success")) {
            setMessage("Order placed! You will receive an email confirmation.");
        }

        if (query.get("canceled")) {
            setMessage("Order canceled -- continue to shop around and checkout when you're ready.");
        }
    }, []);

    useEffect(() => {
        let active = true;
        const fetchAll = async () => {
            try {
                setLoading(true);
                const productsQuery = query(
                    collection(db, "products"),
                    where("active", "==", true)
                );
                const querySnapshot = await getDocs(productsQuery);
                const productDocs = querySnapshot.docs;
                const optionPromises: Promise<PriceOption[]>[] = productDocs.map(async (pDoc) => {
                    const data: any = pDoc.data();
                    const priceSnap = await getDocs(collection(pDoc.ref, "prices"));
                    const list: PriceOption[] = [];
                    priceSnap.forEach(priceDoc => {
                        const price: any = priceDoc.data();
                        if (!price?.unit_amount) return; // skip malformed
                        list.push({
                            productId: pDoc.id,
                            productName: data.name || 'Subscription',
                            priceId: priceDoc.id,
                            amount: price.unit_amount / 100,
                            currency: (price.currency || 'usd').toUpperCase(),
                            interval: price?.recurring?.interval
                        });
                    });
                    return list;
                });
                const nested = await Promise.all(optionPromises);
                const flat = nested.flat();
                if (active) {
                    setPriceOptions(flat);
                    setLoadError(null);
                }
            } catch (e: any) {
                if (active) setLoadError(e?.message || 'Failed to load subscription options');
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchAll();
        return () => { active = false; };
    }, []);

    return message ? (
        <section>
            <p>{message}</p>
        </section>
    ) : (
        <section>
            <div>Subscription Options:</div>
            {loading && (
                <p className="mt-2 text-sm text-slate-500">Loading...</p>
            )}
            {!loading && (loadError || priceOptions.length === 0) && (
                <p className="mt-2 text-sm text-red-600">Could not fetch subscription options at this time.</p>
            )}
            {!loading && priceOptions.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                    {priceOptions.map(opt => {
                        const isSelected = selectedPriceId === opt.priceId;
                        return (
                            <button
                                key={opt.priceId}
                                type="button"
                                onClick={() => setSelectedPriceId(isSelected ? null : opt.priceId)}
                                className={`text-left p-3 rounded border transition-colors ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium">{opt.productName}</h3>
                                        <div className="text-sm text-gray-600">
                                            <span>{opt.amount.toFixed(2)} {opt.currency}{opt.interval ? ` / ${opt.interval}` : ''}</span>
                                        </div>
                                    </div>
                                    <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${isSelected ? 'border-blue-500' : 'border-gray-400'}`}>
                                        {isSelected && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            <button
                type="button"
                className="mt-4 px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedPriceId}
                onClick={() => {
                    if (!selectedPriceId) return;
                    startCheckout(currentUser, selectedPriceId);
                }}
            >
                Checkout
            </button>
        </section>
    );
}
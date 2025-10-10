// src/app/dashboard/billing/page.tsx
'use client';

import { useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";

function BillingContent() {
    // We get the 'update' function from useSession
    const { data: session, update } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // This effect runs when the page loads after redirect from Stripe
    useEffect(() => {
        if (searchParams.get('success')) {
            // Trigger a session update to get the new 'plan' from the database
            update();
            // Clean up the URL
            router.replace('/dashboard/billing', { scroll: false });
        }
    }, [searchParams, router, update]);
    
    const currentPlan = (session?.user as any)?.plan || 'FREE';

    const handleManageSubscription = async () => {
        setIsLoading(true);
        const res = await fetch('/api/billing/manage-subscription', { method: 'POST' });
        const data = await res.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Billing</h1>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-2">Your Plan</h2>
                
                {currentPlan === 'PREMIUM' ? (
                    <div>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">
                            You are on the <span className="font-bold text-orange-500">PREMIUM</span> plan.
                        </p>
                        <div className="flex items-center gap-2 text-green-500 mb-4">
                            <CheckCircle size={18} />
                            <span className="text-sm">All premium features unlocked.</span>
                        </div>
                        <button 
                            onClick={handleManageSubscription}
                            disabled={isLoading}
                            className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-400"
                        >
                            {isLoading ? 'Loading...' : 'Manage Subscription'}
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">
                            You are currently on the <span className="font-bold">FREE</span> plan.
                        </p>
                        <button 
                            onClick={handleManageSubscription}
                            disabled={isLoading}
                            className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:bg-gray-400"
                        >
                            {isLoading ? 'Loading...' : 'Upgrade to Premium'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Wrap the component in Suspense because useSearchParams() requires it.
export default function BillingPage() {
    return (
        <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
            <BillingContent />
        </Suspense>
    )
}
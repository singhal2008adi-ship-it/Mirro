"use client";

import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Download, Share2, Heart } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface TryOnResult {
    id: string;
    generated_image: string;
    clothing_image: string;
    person_image: string;
    // Additional fields can be added later (price comparison, etc.)
}

function ResultsContent() {
    const searchParams = useSearchParams();
    const resultId = searchParams?.get("id");
    const [result, setResult] = useState<TryOnResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!resultId) {
            setError("No result ID provided.");
            setLoading(false);
            return;
        }
        const fetchResult = async () => {
            try {
                const res = await fetch(`http://localhost:5001/generate-tryon/${resultId}`);
                if (!res.ok) {
                    throw new Error(`Failed to fetch result (${res.status})`);
                }
                const data = await res.json();
                setResult(data);
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : String(e));
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [resultId]);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-4 border-accent rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-foreground rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Generating your virtual try‑on...</h2>
                <p className="text-muted-foreground">Preparing your result and fetching live prices.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-destructive">{error}</p>
                <Link href="/dashboard" className="mt-4 text-primary underline">
                    Return to dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="flex-1 container mx-auto p-4 max-w-6xl py-8">
            <div className="mb-8 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center text-sm font-medium hover:text-foreground/80 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Try‑On
                </Link>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium">
                        <Heart className="w-4 h-4" /> Save
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium">
                        <Download className="w-4 h-4" /> Download
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Result Image */}
                <div className="flex flex-col items-center">
                    <div className="w-full max-w-md aspect-[3/4] bg-accent rounded-2xl border border-border overflow-hidden relative shadow-lg">
                        {result?.generated_image ? (
                            <img src={result.generated_image} alt="Try‑On Result" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                <span className="text-4xl">✨</span>
                                <p className="font-medium">AI Try‑On Result goes here.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details & Price Comparison */}
                <div className="flex flex-col space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">Your Virtual Try‑On</h2>
                        <p className="text-muted-foreground">Generated based on your uploaded images.</p>
                    </div>

                    {/* Placeholder for price comparison – can be populated later */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b border-border pb-2">Price Comparison</h3>
                        <p className="text-muted-foreground">Price data will appear here once integrated.</p>
                    </div>

                    {/* Similar Suggestions placeholder */}
                    <div className="space-y-4 pt-4">
                        <h3 className="text-xl font-semibold border-b border-border pb-2">Similar Suggestions</h3>
                        <p className="text-muted-foreground">Similar items will be shown here.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-4 border-accent rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-foreground rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Loading...</h2>
            </div>
        }>
            <ResultsContent />
        </Suspense>
    );
}

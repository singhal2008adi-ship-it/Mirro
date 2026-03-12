"use client";

import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Download, Share2, Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface TryOnResult {
    id: string;
    generated_image: string;
    clothing_image: string;
    person_image: string;
    product_name?: string;
}

interface PriceComparison {
    marketplace: string;
    price: string;
    shipping_cost?: string;
    product_url: string;
    image_url: string;
}

interface SimilarSuggestion {
    id: string;
    title: string;
    price: string;
    marketplace: string;
    image_url: string;
    link: string;
}

function ResultsContent() {
    const searchParams = useSearchParams();
    const resultId = searchParams?.get("id");
    const [result, setResult] = useState<TryOnResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [comparisons, setComparisons] = useState<PriceComparison[]>([]);
    const [suggestions, setSuggestions] = useState<SimilarSuggestion[]>([]);
    const [fetchingDetails, setFetchingDetails] = useState(false);

    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    useEffect(() => {
        // Read generated image from localStorage
        const storedImage = localStorage.getItem("generatedImage");
        if (storedImage) {
            // Append base64 prefix if missing
            const imageSrc = storedImage.startsWith("data:image") ? storedImage : `data:image/jpeg;base64,${storedImage}`;
            setGeneratedImage(imageSrc);
            setResult({
                id: "gemini-result",
                generated_image: imageSrc,
                clothing_image: "",
                person_image: "",
                product_name: "Virtual Try-On Output"
            });
        }
        setLoading(false);
    }, []);

    const handleShare = async () => {
        if (!result?.generated_image) return;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'My Mirro Try-On Result',
                    text: `Check out how this ${result.product_name || 'item'} looks on me!`,
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (e) {
            console.error('Share failed', e);
        }
    };

    const handleDownload = () => {
        if (!result?.generated_image) return;
        const link = document.createElement('a');
        link.href = result.generated_image;
        link.download = `mirro-try-on-${resultId}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSave = () => {
        // Mock save for now
        alert('Look saved to your profile!');
    };

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
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium"
                    >
                        <Heart className="w-4 h-4" /> Save
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium"
                    >
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium"
                    >
                        <Download className="w-4 h-4" /> Download
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Result Image */}
                <div className="flex flex-col space-y-8">
                    <div className="w-full aspect-[3/4] bg-accent rounded-2xl border border-border overflow-hidden relative shadow-lg">
                        {result?.generated_image ? (
                            <img src={result.generated_image} alt="Try‑On Result" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                <span className="text-4xl">✨</span>
                                <p className="font-medium">AI Try‑On Result goes here.</p>
                            </div>
                        )}
                    </div>

                    {/* Your Inputs Section */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div className="space-y-2">
                            <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Your Photo</p>
                            <div className="aspect-[3/4] bg-accent rounded-xl overflow-hidden border border-border">
                                {result?.person_image ? (
                                    <img src={result.person_image} alt="Original Person" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No original photo</div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Clothing Item</p>
                            <div className="aspect-[3/4] bg-accent rounded-xl overflow-hidden border border-border">
                                {result?.clothing_image ? (
                                    <img src={result.clothing_image} alt="Selected Clothing" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No item photo</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details & Price Comparison */}
                <div className="flex flex-col space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">
                            {result?.product_name || "Your Virtual Try‑On"}
                        </h2>
                        <p className="text-muted-foreground">Generated based on your uploaded images.</p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b border-border pb-2">Price Comparison</h3>
                        {fetchingDetails ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" /> Fetching live prices...
                            </div>
                        ) : comparisons.length > 0 ? (
                            <div className="space-y-3">
                                {comparisons.map((comp, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-accent rounded-xl border border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center border border-border">
                                                <span className="text-[10px] font-bold text-black uppercase">{comp.marketplace.split(' ')[0]}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold">{comp.price}</p>
                                                <p className="text-xs text-muted-foreground">{comp.marketplace} • {comp.shipping_cost}</p>
                                            </div>
                                        </div>
                                        <a href={comp.product_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-foreground text-background text-xs font-bold rounded-lg">
                                            Buy Now
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No price comparisons found for this item.</p>
                        )}
                    </div>

                    <div className="space-y-4 pt-4">
                        <h3 className="text-xl font-semibold border-b border-border pb-2">Similar Suggestions</h3>
                        {fetchingDetails ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" /> Finding similar items...
                            </div>
                        ) : suggestions.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {suggestions.map((sugg) => (
                                    <div key={sugg.id} className="group">
                                        <div className="aspect-[3/4] bg-accent rounded-xl overflow-hidden border border-border mb-2 relative">
                                            <img src={sugg.image_url} alt={sugg.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-background/80 backdrop-blur-sm rounded text-[10px] font-bold">
                                                {sugg.marketplace}
                                            </div>
                                        </div>
                                        <h4 className="font-medium text-sm line-clamp-1">{sugg.title}</h4>
                                        <p className="font-bold text-sm">{sugg.price}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Looking for similar items...</p>
                        )}
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

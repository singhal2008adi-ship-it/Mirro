"use client";

import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { Camera, Image as ImageIcon, Link as LinkIcon, Upload, CheckCircle2, Loader2, ScanLine } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();

    // State: 'setup' -> 'scanner' -> 'processing'
    const [step, setStep] = useState<'setup' | 'scanner' | 'processing'>('setup');
    const [personImage, setPersonImage] = useState<string | null>(null);
    const [clothingImage, setClothingImage] = useState<string | null>(null);
    const [linkInput, setLinkInput] = useState('');

    const [isUploading, setIsUploading] = useState(false);
    const webcamRef = useRef<Webcam>(null);

    // Helper to handle fake API delays
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const handlePersonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            // Mock upload delay
            await sleep(1000);
            const url = URL.createObjectURL(file);
            setPersonImage(url);
            setIsUploading(false);
            setStep('scanner');
        }
    };

    const handleCaptureClothing = async () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setClothingImage(imageSrc);
                processTryOn();
            }
        }
    };

    const handleGalleryClothing = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setClothingImage(URL.createObjectURL(file));
            processTryOn();
        }
    };

    const handleLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (linkInput) {
            processTryOn();
        }
    };



    const processTryOn = async () => {
        setStep('processing');
        try {
            // Upload person image if not already uploaded (personImage holds preview URL)
            let personId: string | undefined;
            if (personImage) {
                const file = await fetch(personImage).then(r => r.blob()).then(b => new File([b], 'person.jpg'));
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/user-image`, {
                    method: 'POST',
                    body: (() => {
                        const fd = new FormData();
                        fd.append('image', file);
                        fd.append('type', 'front');
                        return fd;
                    })(),
                });
                const data = await res.json();
                personId = data.id;
            }

            // Determine clothing image ID and name
            let clothingId: string | undefined;
            let extractedProductName = 'Captured Outfit';

            if (clothingImage) {
                const file = await fetch(clothingImage).then(r => r.blob()).then(b => new File([b], 'clothing.jpg'));
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/clothing-image`, {
                    method: 'POST',
                    body: (() => {
                        const fd = new FormData();
                        fd.append('image', file);
                        fd.append('source', 'gallery');
                        return fd;
                    })(),
                });
                const data = await res.json();
                clothingId = data.id;
            } else if (linkInput) {
                // Extract product via backend link extraction
                const extractRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/extract`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: linkInput, userId: 'mock-id' }),
                });
                const extractData = await extractRes.json();
                clothingId = extractData.id;
                extractedProductName = extractData.productName;
            }

            if (!personId || !clothingId) {
                throw new Error('Missing required images');
            }

            // Call generate-tryon API
            const tryonRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate-tryon`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'mock-id',
                    clothingImageId: clothingId,
                    personImageId: personId,
                    productName: extractedProductName
                }),
            });
            const tryonData = await tryonRes.json();
            const resultId = tryonData.id;
            router.push(`/results?id=${resultId}`);
        } catch (e) {
            console.error(e);
            setStep('scanner');
        }
    };
    // ---------------------------------------------------------------------------
    // STEP 1: SETUP (PERSON IMAGE)
    // ---------------------------------------------------------------------------
    if (step === 'setup') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full text-center">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mb-6">
                    <Camera className="w-10 h-10 text-foreground" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Setup Your Profile</h1>
                <p className="text-muted-foreground mb-8">
                    Upload a clear, front-facing photo of yourself. We only ask for this once.
                </p>

                <label className="w-full relative cursor-pointer group">
                    <input
                        type="file"
                        accept="image/jpeg, image/png, image/webp"
                        className="hidden"
                        onChange={handlePersonUpload}
                        disabled={isUploading}
                    />
                    <div className="w-full py-4 px-6 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center bg-card group-hover:bg-accent group-hover:border-foreground transition-all">
                        {isUploading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-muted-foreground mb-3 group-hover:text-foreground transition-colors" />
                                <span className="font-semibold">Tap to Upload Photo</span>
                                <span className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP (Max 10MB)</span>
                            </>
                        )}
                    </div>
                </label>
            </div>
        );
    }

    // ---------------------------------------------------------------------------
    // PROCESSING OVERLAY
    // ---------------------------------------------------------------------------
    if (step === 'processing') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-4 border-accent rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-foreground rounded-full border-t-transparent animate-spin"></div>
                    <ScanLine className="absolute inset-0 m-auto w-8 h-8 text-foreground animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Analyzing Clothing...</h2>
                <p className="text-muted-foreground">Preparing your virtual try-on and fetching live prices.</p>
            </div>
        );
    }

    // ---------------------------------------------------------------------------
    // STEP 2: SCANNER UI (UPI QR STYLE)
    // ---------------------------------------------------------------------------
    return (
        <div className="flex-1 flex flex-col bg-black text-white relative overflow-hidden">
            {/* Top Bar Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-2">
                    {personImage && (
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
                            <img src={personImage} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <span className="text-sm font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-green-400" /> Ready
                    </span>
                </div>
            </div>

            {/* Camera Viewfinder */}
            <div className="flex-1 relative bg-black flex items-center justify-center">
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />

                {/* Scanner Target Box */}
                <div className="relative z-10 w-64 h-80 border-2 border-white/50 rounded-2xl flex items-center justify-center shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                    <ScanLine className="w-12 h-12 text-white/50 animate-[pulse_2s_ease-in-out_infinite]" />
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="bg-zinc-950 p-6 z-20 rounded-t-3xl border-t border-zinc-800 flex flex-col gap-4">

                {/* Scan Button */}
                <button
                    onClick={handleCaptureClothing}
                    className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                >
                    <ScanLine className="w-6 h-6" />
                    Scan Clothing
                </button>

                <div className="grid grid-cols-2 gap-4 mt-2">
                    <label className="flex flex-col items-center justify-center p-4 bg-zinc-900 rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors border border-zinc-800">
                        <input type="file" accept="image/*" className="hidden" onChange={handleGalleryClothing} />
                        <ImageIcon className="w-6 h-6 mb-2 text-zinc-400" />
                        <span className="text-sm font-medium">Gallery</span>
                    </label>

                    <div className="relative group">
                        <button className="w-full flex flex-col items-center justify-center p-4 bg-zinc-900 rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors border border-zinc-800 group-hover:rounded-b-none">
                            <LinkIcon className="w-6 h-6 mb-2 text-zinc-400" />
                            <span className="text-sm font-medium">Paste Link</span>
                        </button>
                        {/* Expanded Link Input on Hover/Focus-within */}
                        <form onSubmit={handleLinkSubmit} className="absolute bottom-full left-0 right-0 bg-zinc-800 p-2 rounded-t-xl hidden group-hover:flex focus-within:flex border-t border-x border-zinc-700">
                            <input
                                type="url"
                                value={linkInput}
                                onChange={(e) => setLinkInput(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-zinc-950 text-white px-3 py-2 rounded text-sm outline-none border border-zinc-700 focus:border-zinc-500"
                                required
                            />
                            <button type="submit" className="ml-2 bg-white text-black px-3 py-2 rounded text-sm font-bold">Go</button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}

import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background text-foreground transition-colors overflow-hidden">
      <div className="relative z-10 flex flex-col items-center justify-center">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 selection:bg-foreground selection:text-background leading-tight">
          Try On <br /> Everything.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12">
          A seamless virtual fitting room. Upload your photo and any clothing item to see how it looks instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-foreground text-background font-semibold rounded-full hover:bg-foreground/90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            Start Fitting
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 border-2 border-border font-semibold rounded-full hover:border-foreground transition-all"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          <div className="p-6 border border-border rounded-2xl bg-card hover:bg-accent transition-colors text-left flex flex-col items-start justify-center">
            <h3 className="text-xl font-bold mb-3">1. Upload Photo</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Upload a front-facing image of yourself to get started.</p>
          </div>
          <div className="p-6 border border-border rounded-2xl bg-card hover:bg-accent transition-colors text-left flex flex-col items-start justify-center">
            <h3 className="text-xl font-bold mb-3">2. Add Clothing</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Snap a photo of clothes or paste a product link from major marketplaces.</p>
          </div>
          <div className="p-6 border border-border rounded-2xl bg-card hover:bg-accent transition-colors text-left flex flex-col items-start justify-center">
            <h3 className="text-xl font-bold mb-3">3. Compare & Save</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">See the AI try-on result and compare prices instantly before buying.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold tracking-tighter">
                    Mirro
                </Link>
                <div className="flex items-center gap-6 text-sm font-medium">
                    <Link href="/dashboard" className="transition-colors hover:text-foreground/80">Try-On</Link>
                    <Link href="/login" className="transition-colors hover:text-foreground/80">Log In</Link>
                    <Link
                        href="/signup"
                        className="bg-foreground text-background px-4 py-2 rounded-md hover:bg-foreground/90 transition-colors"
                    >
                        Sign Up
                    </Link>
                </div>
            </div>
        </nav>
    );
}

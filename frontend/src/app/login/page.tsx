import Link from 'next/link';

export default function LoginPage() {
    return (
        <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md p-8 border border-border rounded-2xl bg-card shadow-lg">
                <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h2>
                <p className="text-muted-foreground text-sm mb-8">Enter your credentials to access your account.</p>

                <form className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                            id="email"
                            placeholder="name@example.com"
                            required
                            type="email"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                            Password
                        </label>
                        <input
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                            id="password"
                            required
                            type="password"
                        />
                    </div>

                    <button
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-foreground text-background hover:bg-foreground/90 h-10 px-4 py-2 w-full mt-4"
                        type="submit"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-foreground underline underline-offset-4 hover:text-foreground/80">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

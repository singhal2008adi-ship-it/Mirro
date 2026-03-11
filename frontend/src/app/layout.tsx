import "./globals.css";

export const metadata = {
  title: "Mirro",
  description: "Virtual Try-On for Clothes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

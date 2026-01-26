import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GroceryGenius - Find the Best Grocery Deals",
  description: "Aggregate weekly grocery deals from your favorite stores. Search deals, track prices, and save money on groceries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

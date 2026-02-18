import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Super Admin Panel - ChaosAR",
  description: "Super Admin Panel for managing restaurants",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

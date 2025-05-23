import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";
import { AuthProvider } from "@/lib/auth-context";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "CareHome - Nursing Home Management System",
  description: "Comprehensive solution for nursing home operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, "Segoe UI", "Geist", Roboto, Helvetica, Arial, sans-serif',
          backgroundColor: '#f5f7fa',
          height: '100%'
        }}
      >
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}

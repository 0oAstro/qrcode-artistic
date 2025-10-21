import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Suspense } from "react"
import { Analytics } from "@vercel/analytics/react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "Qraft: Artistic QR Code Generator",
  description: "Create beautiful and artistic QR codes with your own images.",
  metadataBase: new URL("https://qraft.vercel.app"),

  openGraph: {
    title: "Qraft: Artistic QR Code Generator",
    description: "Create beautiful and artistic QR codes with your own images.",
    url: "https://qraft.vercel.app",
    siteName: "Qraft",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Qraft: Artistic QR Code Generator",
    description: "Create beautiful and artistic QR codes with your own images.",
    images: ["/logo.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-mono antialiased">
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}

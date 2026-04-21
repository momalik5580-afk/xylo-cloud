import type { Metadata } from "next"
import { Rajdhani } from "next/font/google"
import "./globals.css"
import { Toaster } from "react-hot-toast"

const rajdhani = Rajdhani({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
})

export const metadata: Metadata = {
  title: "XYLO Hotel Operations",
  description: "Hotel Management Dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${rajdhani.variable} font-sans`}>
        {children}
        <Toaster position="top-center" toastOptions={{
          style: {
            background: '#0a0c10',
            color: '#00f2ff',
            border: '1px solid rgba(0,242,255,0.2)',
            boxShadow: '0 0 15px rgba(0,242,255,0.1)'
          }
        }} />
      </body>
    </html>
  )
}
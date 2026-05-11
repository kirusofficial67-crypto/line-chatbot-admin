import type { Metadata } from 'next'
import { Inter, Noto_Sans, Playfair_Display } from 'next/font/google'
import "./globals.css";
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { cn } from "@/lib/utils";

const playfairDisplayHeading = Playfair_Display({subsets:['latin'],variable:'--font-heading'});

const notoSans = Noto_Sans({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LINE Chatbot Admin',
  description: 'ระบบจัดการ LINE Chatbot',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={cn("font-sans", notoSans.variable, playfairDisplayHeading.variable)}>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

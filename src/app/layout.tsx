import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ChannelOS — Automação de Canais YouTube",
  description: "SaaS de automação de canais dark YouTube para criadores solo brasileiros",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}

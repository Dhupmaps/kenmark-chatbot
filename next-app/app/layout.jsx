import './globals.css'

export const metadata = {
  title: 'Kenmark Chatbot (Next.js)',
  description: 'Kenmark chatbot migration (Next.js)'
}

export default function RootLayout({ children }) {
  const themeInit = `(() => {
    try {
      const stored = localStorage.getItem('kenmark_theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const useDark = stored ? stored === 'dark' : prefersDark;
      const el = document.documentElement;
      if (useDark) el.classList.add('dark'); else el.classList.remove('dark');
    } catch(e) {}
  })();`;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="bg-gray-100 dark:bg-[#0B1220] text-gray-900 dark:text-white">{children}</body>
    </html>
  )
}

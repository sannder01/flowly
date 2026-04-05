import Providers from '@/components/Providers'

export const metadata = {
  title: 'Chronicle',
  description: 'Your personal task tracker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Chronicle',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Chronicle',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#070708',
  },
}

export const viewport = {
  themeColor: '#070708',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        {/* iOS PWA icons — create these images in public/ folder */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icon-120.png" />

        {/* iOS splash screens for common devices */}
        <link rel="apple-touch-startup-image"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
          href="/splash-390x844.png" />
        <link rel="apple-touch-startup-image"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
          href="/splash-430x932.png" />

        {/* Force re-auth check in standalone mode */}
        <script dangerouslySetInnerHTML={{ __html: `
          // iOS PWA: if standalone mode, ensure we don't lose session
          if (window.navigator.standalone) {
            // Mark as PWA session
            sessionStorage.setItem('pwa_mode', '1');
          }
        `}} />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#070708' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

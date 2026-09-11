import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ChatGPT to Wonderful PDF Notes | Convert AI Chats to Study Guides & Executive Briefs',
    template: '%s | ChatPDF Notes Studio',
  },
  description:
    'Free online tool to convert any shared ChatGPT conversation link or copied chat text into publication-grade PDF notes, study guides, exam cheatsheets, and executive briefs with styled tables and code highlighting.',
  keywords: [
    'ChatGPT to PDF',
    'ChatGPT notes generator',
    'convert ChatGPT conversation to PDF',
    'ChatGPT share link to PDF',
    'AI study notes maker',
    'ChatGPT export to PDF',
    'ChatGPT cheatsheet generator',
    'AI executive brief generator',
    'ChatGPT markdown to PDF',
    'IBPS Clerk exam notes ChatGPT',
    'system design notes ChatGPT',
    'clean chatgpt transcript pdf',
  ],
  authors: [{ name: 'ChatPDF Notes Team' }],
  creator: 'ChatPDF Notes Studio',
  publisher: 'ChatPDF Notes',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ChatGPT to Wonderful PDF Notes | AI Study Guide & Executive Brief Studio',
    description:
      'Transform any ChatGPT share link or conversation text into publication-grade PDF notes, study guides, exam cheatsheets, and executive briefs with 1 click.',
    url: siteUrl,
    siteName: 'ChatPDF Notes Studio',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ChatGPT to Wonderful PDF Notes Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChatGPT to Wonderful PDF Notes | AI Study Guide & Executive Brief Studio',
    description:
      'Turn any ChatGPT shared link into structured study notes, exam cheatsheets, and publication-ready PDFs with 1 click.',
    images: ['/og-image.png'],
    creator: '@chatpdfnotes',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'productivity',
  verification: {
    google: 'google852b862769123100',
  },
};

// JSON-LD Structured Data (Schema.org)
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${siteUrl}/#webapp`,
      name: 'ChatPDF Notes - ChatGPT to Wonderful PDF Notes',
      url: siteUrl,
      description:
        'Transform ChatGPT shared links or copied conversation text into structured, publication-grade PDF notes, executive briefs, exam cheatsheets, and study guides.',
      applicationCategory: 'EducationalApplication, UtilitiesApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'Convert ChatGPT shared links to high-resolution vector PDF',
        'Automatic synthesis of Executive Summaries & Key Takeaways',
        'Render markdown tables, headers, and syntax-highlighted code',
        'Instant multi-view switching: Study Guide, Cheatsheet Cards, Executive Brief, Polished Chat',
        'Clean removal of ChatGPT search citations and artifacts',
        'Export to Vector PDF, Markdown (.md), or Clipboard',
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${siteUrl}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I convert a ChatGPT conversation link to PDF notes?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Simply copy the public share link from your ChatGPT conversation (e.g., https://chatgpt.com/share/...) and paste it into ChatPDF Notes Studio. Alternatively, copy the chat text and click "1-Click Paste From Clipboard". The studio automatically formats and synthesizes the content into wonderful PDF notes.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does ChatPDF Notes support markdown tables and code blocks?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! All markdown tables, bullet lists, bold text, and code snippets are rendered into clean, publication-grade HTML tables and syntax-highlighted code blocks with line numbers.',
          },
        },
        {
          '@type': 'Question',
          name: 'What note styles and themes are available?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can choose between 4 note structures (Comprehensive Study Guide, Executive Brief, Cheatsheet Cards, and Polished Chat) and 4 visual themes (Academic Scholar, Modern Indigo, Minimalist Editorial, and Emerald Notion).',
          },
        },
        {
          '@type': 'Question',
          name: 'Is ChatPDF Notes free to use?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, ChatPDF Notes is completely free to use with zero API keys required.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}

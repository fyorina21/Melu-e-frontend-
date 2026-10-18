import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Root HTML template for Expo Router web rendering.
 * Preloads critical icon fonts and applies `font-display: swap` to prevent render blocking.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, shrink-to-fit=no"
        />
        <meta
          name="description"
          content="Melue - Comprehensive Clinical & Special Education Therapy Management System"
        />
        <title>Melue - Therapy & Education Platform</title>

        {/* Preload critical icon font to eliminate render-blocking latency */}
        <link
          rel="preload"
          href="/fonts/Feather.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Ionicons.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />

        <ScrollViewStyleReset />

        <style
          dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: 'Feather';
                src: url('/fonts/Feather.ttf') format('truetype');
                font-display: swap;
              }
              @font-face {
                font-family: 'feather';
                src: url('/fonts/Feather.ttf') format('truetype');
                font-display: swap;
              }
              @font-face {
                font-family: 'Ionicons';
                src: url('/fonts/Ionicons.ttf') format('truetype');
                font-display: swap;
              }
              @font-face {
                font-family: 'ionicons';
                src: url('/fonts/Ionicons.ttf') format('truetype');
                font-display: swap;
              }
              /* Eliminate layout shift and enforce clean body defaults */
              html, body {
                height: 100%;
                overflow: hidden;
              }
              #root {
                display: flex;
                height: 100%;
                flex-direction: column;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: false,

  nitro: {
    preset: 'cloudflare-pages',
  },

  future: {
    compatibilityVersion: 4,
  },

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/google-fonts', '@nuxtjs/color-mode'],

  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark',
  },

  css: ['~/assets/css/main.css'],

  googleFonts: {
    families: {
      'Space Grotesk': [400, 500, 600, 700],
      'DM Sans': [400, 500, 600, 700],
      'JetBrains Mono': [400, 500, 600, 700],
    },
    display: 'swap',
  },

  app: {
    head: {
      title: 'diffspot — Online Text Diff Tool',
      meta: [
        { name: 'description', content: 'Paste. Compare. Ship. A developer-focused online text diff comparison tool.' },
        { name: 'theme-color', content: '#0d0d0d' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },
})

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: false,

  nitro: {
    preset: 'cloudflare-pages',
    modules: ['nitro-cloudflare-dev'],
  },

  future: {
    compatibilityVersion: 4,
  },

  components: [
    { path: '~/components', pathPrefix: false },
    { path: '../node_modules/@diffspot/vue/src/components', pathPrefix: false, extensions: ['vue'] },
  ],

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
        // OpenGraph
        { property: 'og:title', content: 'diffspot — Online Text Diff Tool' },
        { property: 'og:description', content: 'Paste. Compare. Ship. A developer-focused online text diff comparison tool.' },
        { property: 'og:image', content: 'https://diffspot.edufalcao.com/og.png' },
        { property: 'og:url', content: 'https://diffspot.edufalcao.com' },
        { property: 'og:type', content: 'website' },
        // Twitter/X
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'diffspot — Online Text Diff Tool' },
        { name: 'twitter:description', content: 'Paste. Compare. Ship. A developer-focused online text diff comparison tool.' },
        { name: 'twitter:image', content: 'https://diffspot.edufalcao.com/og.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'canonical', href: 'https://diffspot.edufalcao.com' },
      ],
    },
  },
})

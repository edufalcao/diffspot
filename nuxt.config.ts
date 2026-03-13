// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/google-fonts', '@nuxtjs/color-mode', '@nuxt/eslint'],
  ssr: false,

  components: [
    { path: '~/components' },
    { path: '../node_modules/@diffspot/vue/src/components', pathPrefix: false, extensions: ['vue'] }
  ],
  devtools: { enabled: true },

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
        { name: 'twitter:image', content: 'https://diffspot.edufalcao.com/og.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'canonical', href: 'https://diffspot.edufalcao.com' }
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            'name': 'diffspot',
            'url': 'https://diffspot.edufalcao.com',
            'description': 'Paste. Compare. Ship. A developer-focused online text diff comparison tool with split and unified views, word-level highlighting, and multi-format export.',
            'applicationCategory': 'DeveloperApplication',
            'operatingSystem': 'Any',
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'USD'
            },
            'author': {
              '@type': 'Person',
              'name': 'Eduardo Falcão',
              'url': 'https://edufalcao.com'
            }
          })
        }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark'
  },

  future: {
    compatibilityVersion: 4
  },
  compatibilityDate: '2024-11-01',

  nitro: {
    preset: 'cloudflare-pages',
    modules: ['nitro-cloudflare-dev']
  },

  eslint: {
    config: {
      stylistic: {
        semi: true,
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  googleFonts: {
    families: {
      'Space Grotesk': [400, 500, 600, 700],
      'DM Sans': [400, 500, 600, 700],
      'JetBrains Mono': [400, 500, 600, 700]
    },
    display: 'swap'
  }
});

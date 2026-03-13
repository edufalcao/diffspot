import type { Config } from 'tailwindcss';

export default {
  content: [
    // default Nuxt paths (nuxtjs/tailwindcss normally adds these automatically)
    './app/**/*.{vue,ts,js}',
    './pages/**/*.{vue,ts,js}',
    './components/**/*.{vue,ts,js}',
    './layouts/**/*.{vue,ts,js}',
    // @diffspot/vue package components (not scanned by default since it's in node_modules)
    './node_modules/@diffspot/vue/src/**/*.vue'
  ]
} satisfies Config;

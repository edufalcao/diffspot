// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  {
    ignores: ['packages/**', 'server/**', 'tailwind.config.ts']
  },
  {
    rules: {
      '@stylistic/member-delimiter-style': ['error', {
        multiline: { delimiter: 'comma', requireLast: false },
        singleline: { delimiter: 'comma', requireLast: false }
      }]
    }
  }
);

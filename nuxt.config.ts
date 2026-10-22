// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: { port: 8610 },
  app: {
    head: {
      script: [
        { src: 'https://tools.atlesque.dev/consent.js', defer: true },
      ],
      title: 'MIN Ticket Roulette',
      meta: [{ name: 'description', content: 'Who is in charge of MIN tickets this week?' }],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'stylesheet', href: '/fonts/fonts.css' },
      ],
    },
  },
})

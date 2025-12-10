// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],

  supabase: {
    url: 'https://wtlzlmvbylyjvbnyxkos.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0bHpsbXZieWx5anZibnl4a29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjg3MzksImV4cCI6MjA4MDkwNDczOX0.0gGqhIx766nWMukN4o4u9P6JrmwI43_f6oJpi_JXQq4',
    redirect: false
  }
})
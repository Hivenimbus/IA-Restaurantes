export default defineNuxtRouteMiddleware(async (to, from) => {
    const { user, fetchUser } = useAuth()

    // Give it a chance to fetch if it's missing
    if (!user.value) {
        await fetchUser()
    }

    if (!user.value) {
        return navigateTo('/login')
    }
})

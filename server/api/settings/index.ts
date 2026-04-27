import { defineEventHandler, createError, readBody } from 'h3'
import { auth } from '~~/server/utils/auth'
import { db } from '~~/server/utils/db'
import { users } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers
    })

    if (!session) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const userId = session.user.id

    if (event.method === 'GET') {
        const [user] = await db
            .select({ agentWebhookUrl: users.agentWebhookUrl })
            .from(users)
            .where(eq(users.id, userId))

        return { agentWebhookUrl: user?.agentWebhookUrl ?? '' }
    }

    if (event.method === 'POST' || event.method === 'PUT') {
        const body = await readBody(event)
        const { agentWebhookUrl } = body

        await db
            .update(users)
            .set({ agentWebhookUrl: agentWebhookUrl || null })
            .where(eq(users.id, userId))

        return { success: true }
    }
})

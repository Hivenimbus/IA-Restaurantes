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
            .select({
                agentWebhookUrl: users.agentWebhookUrl,
                isAutomaticMode: users.isAutomaticMode,
                averageWaitTime: users.averageWaitTime
            })
            .from(users)
            .where(eq(users.id, userId))

        return {
            agentWebhookUrl: user?.agentWebhookUrl ?? '',
            isAutomaticMode: user?.isAutomaticMode ?? false,
            averageWaitTime: user?.averageWaitTime ?? 30
        }
    }

    if (event.method === 'POST' || event.method === 'PUT') {
        const body = await readBody(event)
        const { agentWebhookUrl, isAutomaticMode, averageWaitTime } = body

        const updateData: any = {}
        if (agentWebhookUrl !== undefined) updateData.agentWebhookUrl = agentWebhookUrl || null
        if (isAutomaticMode !== undefined) updateData.isAutomaticMode = isAutomaticMode
        if (averageWaitTime !== undefined) updateData.averageWaitTime = averageWaitTime

        await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, userId))

        return { success: true }
    }
})

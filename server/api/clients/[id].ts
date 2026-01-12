import { defineEventHandler, createError, readBody } from 'h3'
import { auth } from '~~/server/utils/auth'
import { db } from '~~/server/utils/db'
import { clients } from '~~/server/database/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers
    })

    if (!session) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    const user = session.user
    const id = Number(event.context.params?.id)

    if (event.method === 'PUT') {
        const body = await readBody(event)

        // Basic validation
        if (!body.name || !body.phone) {
            throw createError({ statusCode: 400, statusMessage: 'Name and Phone are required' })
        }

        const [updatedClient] = await db
            .update(clients)
            .set({
                name: body.name,
                phone: body.phone,
                address: body.address,
                updatedAt: new Date()
            })
            .where(and(eq(clients.id, id), eq(clients.userId, user.id)))
            .returning()

        if (!updatedClient) {
            throw createError({ statusCode: 404, statusMessage: 'Client not found' })
        }

        return updatedClient
    }

    if (event.method === 'DELETE') {
        const deleted = await db
            .delete(clients)
            .where(and(eq(clients.id, id), eq(clients.userId, user.id)))
            .returning()

        if (!deleted || deleted.length === 0) {
            throw createError({ statusCode: 404, statusMessage: 'Client not found' })
        }

        return { success: true }
    }
})

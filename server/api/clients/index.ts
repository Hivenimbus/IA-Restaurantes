import { defineEventHandler, createError } from 'h3'
import { auth } from '~~/server/utils/auth'
import { db } from '~~/server/utils/db'
import { clients } from '~~/server/database/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers
    })

    if (!session) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    const user = session.user

    if (event.method === 'GET') {
        const data = await db.query.clients.findMany({
            where: eq(clients.userId, user.id),
            orderBy: [desc(clients.updatedAt)],
            with: {
                lastOrder: {
                    with: {
                        orderItems: true
                    }
                }
            }
        })
        return data
    }
})

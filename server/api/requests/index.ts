import { defineEventHandler, createError, readBody } from 'h3'
import { auth } from '~~/server/utils/auth'
import { db } from '~~/server/utils/db'
import { orderRequests } from '~~/server/database/schema'
import { eq, desc, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers
    })

    if (!session) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    const user = session.user

    if (event.method === 'GET') {
        const requests = await db.query.orderRequests.findMany({
            where: and(
                eq(orderRequests.userId, user.id),
                eq(orderRequests.status, 'pending')
            ),
            orderBy: [desc(orderRequests.createdAt)],
            with: {
                order: {
                    with: {
                        orderItems: true
                    }
                }
            }
        })
        return requests
    }

    if (event.method === 'POST') {
        const body = await readBody(event)

        // Validate required fields
        if (!body.orderId || !body.requestType) {
            throw createError({
                statusCode: 400,
                message: 'Missing required fields'
            })
        }

        const newRequest = await db.insert(orderRequests).values({
            userId: user.id,
            orderId: body.orderId,
            requestType: body.requestType,
            details: body.details,
            webhookUrl: body.webhookUrl,
            status: 'pending' // Default status
        }).returning()

        return newRequest[0]
    }
})

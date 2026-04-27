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
        // Join with orders to find all pending requests for orders owned by this restaurant,
        // regardless of what userId was stored on the request itself
        const requests = await db.query.orderRequests.findMany({
            where: and(
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

        // Filter in application layer: only requests whose order belongs to this restaurant
        const filtered = requests.filter(r => r.order?.userId === user.id)
        return filtered
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

        // Normalize requestType
        const cleanType = body.requestType.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase()
        let normalizedType = cleanType
        if (cleanType.includes('cancelamento')) normalizedType = 'cancellation'
        if (cleanType.includes('edicao')) normalizedType = 'edition'

        const newRequest = await db.insert(orderRequests).values({
            userId: user.id,
            orderId: body.orderId,
            requestType: normalizedType,
            details: body.details,
            webhookUrl: body.webhookUrl,
            status: 'pending' // Default status
        }).returning()

        return newRequest[0]
    }
})

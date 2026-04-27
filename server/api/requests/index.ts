import { defineEventHandler, createError, readBody } from 'h3'
import { auth } from '~~/server/utils/auth'
import { db } from '~~/server/utils/db'
import { orderRequests, orders } from '~~/server/database/schema'
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
        // Direct join: fetch pending requests where the order belongs to this restaurant
        const rows = await db
            .select({
                id: orderRequests.id,
                orderId: orderRequests.orderId,
                userId: orderRequests.userId,
                requestType: orderRequests.requestType,
                status: orderRequests.status,
                details: orderRequests.details,
                webhookUrl: orderRequests.webhookUrl,
                createdAt: orderRequests.createdAt,
                order: {
                    id: orders.id,
                    customerName: orders.customerName,
                    customerPhone: orders.customerPhone,
                    status: orders.status,
                    userId: orders.userId,
                }
            })
            .from(orderRequests)
            .innerJoin(orders, eq(orderRequests.orderId, orders.id))
            .where(
                and(
                    eq(orderRequests.status, 'pending'),
                    eq(orders.userId, user.id)
                )
            )
            .orderBy(desc(orderRequests.createdAt))

        return rows
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

        // Fetch the order to get the restaurant owner's userId
        const [order] = await db
            .select({ userId: orders.userId })
            .from(orders)
            .where(eq(orders.id, body.orderId))
            .limit(1)

        if (!order) {
            throw createError({ statusCode: 404, message: 'Order not found' })
        }

        // The request must be associated to the restaurant owner, not the external caller
        const ownerUserId = order.userId

        // Normalize requestType
        const cleanType = body.requestType.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase()
        let normalizedType = cleanType
        if (cleanType.includes('cancelamento')) normalizedType = 'cancellation'
        if (cleanType.includes('edicao')) normalizedType = 'edition'

        const newRequest = await db.insert(orderRequests).values({
            userId: ownerUserId,
            orderId: body.orderId,
            requestType: normalizedType,
            details: body.details,
            webhookUrl: body.webhookUrl,
            status: 'pending'
        }).returning()

        return newRequest[0]
    }
})

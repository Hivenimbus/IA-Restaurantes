import { defineEventHandler, createError, readBody } from 'h3'
import { auth } from '~~/server/utils/auth'
import { db } from '~~/server/utils/db'
import { orderRequests } from '~~/server/database/schema'
import { eq, desc, and, inArray } from 'drizzle-orm'

// Normalizes request types from external agents (Portuguese) to internal keys
function normalizeRequestType(type: string): string {
    const clean = type.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    if (clean.includes('cancelamento') || clean.includes('cancellation')) return 'cancellation'
    if (clean.includes('edicao') || clean.includes('edition')) return 'edition'
    return type
}

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
                inArray(orderRequests.status, ['pending', 'pendente'])
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

        // Normalize data for frontend consistency
        return requests.map((r: any) => ({
            ...r,
            status: r.status === 'pendente' ? 'pending' : r.status,
            requestType: normalizeRequestType(r.requestType)
        }))
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

        // Normalize requestType using shared helper
        const normalizedType = normalizeRequestType(body.requestType)

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

import { defineEventHandler, createError } from 'h3'
import { auth } from '~~/server/utils/auth'
import { db } from '~~/server/utils/db'
import { clients, orders } from '~~/server/database/schema'
import { eq, desc, sql } from 'drizzle-orm'

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

        // Fetch order counts by phone number
        const orderCounts = await db
            .select({
                phone: orders.customerPhone,
                count: sql`count(*)`.mapWith(Number)
            })
            .from(orders)
            .where(eq(orders.userId, user.id))
            .groupBy(orders.customerPhone)

        const countMap = new Map()
        for (const row of orderCounts) {
            if (row.phone) countMap.set(row.phone, row.count)
        }

        const enrichedData = data.map(client => ({
            ...client,
            orderCount: countMap.get(client.phone) || 0
        }))

        return enrichedData
    }
})

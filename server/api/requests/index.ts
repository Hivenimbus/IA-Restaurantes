import { defineEventHandler, createError, readBody } from 'h3'
import { auth } from '~~/server/utils/auth'
import { db } from '~~/server/utils/db'
import { orderRequests, orders, users } from '~~/server/database/schema'
import { eq, desc, and, inArray, or } from 'drizzle-orm'

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
                or(
                    inArray(orderRequests.status, ['pending', 'pendente']),
                    eq(orderRequests.dismissed, false)
                )
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

        let initialStatus = 'pending'
        let webhookMessage = ''

        // Check for automatic mode
        const [userConfig] = await db.select({ isAutomaticMode: users.isAutomaticMode, agentWebhookUrl: users.agentWebhookUrl }).from(users).where(eq(users.id, user.id))
        let targetOrder: any = null

        if (userConfig?.isAutomaticMode) {
            const [order] = await db.select().from(orders).where(eq(orders.id, body.orderId)).limit(1)
            targetOrder = order
            if (order) {
                if (['Enviado', 'Entregue', 'Cancelado'].includes(order.status)) {
                    initialStatus = 'rejected'
                    webhookMessage = normalizedType === 'cancellation' ? 'Cancelamento recusado' : 'Edição recusada'
                } else {
                    initialStatus = 'approved'
                    if (normalizedType === 'cancellation') {
                        webhookMessage = 'Cancelamento aceito'
                        await db.update(orders).set({ status: 'Cancelado' }).where(eq(orders.id, order.id))
                    } else {
                        webhookMessage = 'Edição aceita, utilize as tools necessárias para editar imediatamente os itens do pedido como o cliente solicitou anteriormente. Após isso informe ele'
                    }
                }
            }
        }

        const newRequest = await db.insert(orderRequests).values({
            userId: user.id,
            orderId: body.orderId,
            requestType: normalizedType,
            details: body.details,
            webhookUrl: body.webhookUrl,
            status: initialStatus
        }).returning()

        // Trigger Webhook if auto-resolved
        if (userConfig?.isAutomaticMode && initialStatus !== 'pending' && webhookMessage && userConfig?.agentWebhookUrl && targetOrder) {
             try {
                await $fetch(userConfig.agentWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: {
                        message: webhookMessage,
                        to: targetOrder.customerPhone ?? '',
                        orderId: body.orderId,
                        userId: user.id
                    }
                })
             } catch (e) {
                console.error('[Webhook] Failed to auto-trigger request webhook:', e)
             }
        }

        return newRequest[0]
    }
})

import { eq, and } from 'drizzle-orm'
import { orderRequests, orders, users } from '~~/server/database/schema'
import { defineEventHandler, createError, readBody, getRouterParam } from 'h3'
import { auth } from '~~/server/utils/auth'
import { db } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers
    })

    if (!session) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    const user = session.user
    const id = getRouterParam(event, 'id')

    if (event.method === 'PUT') {
        const body = await readBody(event)
        const { status, dismissed } = body

        // Handle dismissing the request
        if (dismissed !== undefined) {
            const updated = await db
                .update(orderRequests)
                .set({ dismissed })
                .where(and(eq(orderRequests.id, Number(id)), eq(orderRequests.userId, user.id)))
                .returning()
            return updated[0]
        }

        if (!['approved', 'rejected'].includes(status)) {
            throw createError({
                statusCode: 400,
                message: 'Invalid status'
            })
        }

        // Update request status
        const updatedRequest = await db
            .update(orderRequests)
            .set({ status })
            .where(and(eq(orderRequests.id, Number(id)), eq(orderRequests.userId, user.id)))
            .returning()

        if (!updatedRequest.length) {
            throw createError({
                statusCode: 404,
                message: 'Request not found'
            })
        }

        const request = updatedRequest[0]

        // Business Logic: If Approved
        let message = ''

        // Check request type robustly
        const type = request.requestType.toLowerCase()
        const isCancellation = type.includes('cancel')
        const isEdition = type.includes('edi') || type.includes('alt')

        if (status === 'approved') {
            if (isCancellation) {
                // Automatically cancel the order
                await db
                    .update(orders)
                    .set({ status: 'Cancelado' })
                    .where(eq(orders.id, request.orderId))

                message = 'Cancelamento aceito'
            } else if (isEdition) {
                message = 'Edição aceita, utilize as tools necessárias para editar imediatamente os itens do pedido como o cliente solicitou anteriormente. Após isso informe ele'
            }
        } else if (status === 'rejected') {
            if (isCancellation) {
                message = 'Cancelamento recusado'
            } else if (isEdition) {
                message = 'Edição recusada'
            }
        }

        // Fetch order to get customer phone
        const [order] = await db.select().from(orders).where(eq(orders.id, request.orderId)).limit(1);

        // Fetch the agent webhook URL for this user/restaurant
        const [userRow] = await db
            .select({ agentWebhookUrl: users.agentWebhookUrl })
            .from(users)
            .where(eq(users.id, user.id))

        const webhookUrl = userRow?.agentWebhookUrl

        // Trigger Webhook using same agent URL as order status
        if (message && webhookUrl) {
            try {
                await $fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: {
                        message,
                        to: order?.customerPhone ?? '',
                        orderId: request.orderId,
                        userId: user.id
                    }
                })
                console.log(`[Webhook] Request ${status} sent to ${webhookUrl} for order #${request.orderId}`)
            } catch (e) {
                console.error('[Webhook] Failed to trigger request webhook:', e)
                // We don't throw here to avoid failing the main request if webhook fails
            }
        } else if (!webhookUrl) {
            console.log('[Webhook] No agent webhook configured for this restaurant, skipping.')
        }

        return request
    }
})

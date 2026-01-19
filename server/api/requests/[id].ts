import { eq, and } from 'drizzle-orm'
import { orderRequests, orders } from '~~/server/database/schema'
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
        const { status } = body

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

        // Trigger Webhook
        if (message && order?.customerPhone) {
            try {
                await $fetch('https://n8n.hivebot.cloud/webhook/solicitacoes', {
                    method: 'POST',
                    headers: {
                        'client_number': order.customerPhone
                    },
                    body: {
                        message,
                        status,
                        requestId: request.id,
                        orderId: request.orderId
                    }
                })
            } catch (e) {
                console.error('Failed to trigger webhook', e)
                // We don't throw here to avoid failing the main request if webhook fails
            }
        }

        return request
    }
})

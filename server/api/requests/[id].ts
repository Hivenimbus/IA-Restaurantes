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

        if (status === 'approved') {
            if (request.requestType === 'cancellation') {
                // Automatically cancel the order
                await db
                    .update(orders)
                    .set({ status: 'Cancelado' })
                    .where(eq(orders.id, request.orderId))

                message = 'Cancelamento aceito'
            } else if (request.requestType === 'edition') {
                message = 'Edição aceita, utilize sua tool para editar os itens do pedido conforme o cliente solicitou e o informe'
            }
        } else if (status === 'rejected') {
            if (request.requestType === 'cancellation') {
                message = 'Cancelamento recusado'
            } else if (request.requestType === 'edition') {
                message = 'Edição recusada'
            }
        }

        // Trigger Webhook if URL exists
        if (request.webhookUrl && message) {
            try {
                await $fetch(request.webhookUrl, {
                    method: 'POST',
                    body: { message }
                })
            } catch (e) {
                console.error('Failed to trigger webhook', e)
                // We don't throw here to avoid failing the main request if webhook fails
            }
        }

        return request
    }
})

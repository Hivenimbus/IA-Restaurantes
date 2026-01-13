import { defineEventHandler, createError, readBody } from 'h3'
import { auth } from '~~/server/utils/auth'
import { db } from '~~/server/utils/db'
import { orders } from '~~/server/database/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers
  })

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const user = session.user
  const id = Number(event.context.params?.id)

  if (event.method === 'PUT') {
    const body = await readBody(event)
    const { status } = body

    const updateData: any = { status }

    // If status is terminal (Entregue/Cancelado), set completed_at
    if (status === 'Entregue' || status === 'Cancelado') {
      updateData.completedAt = new Date()
    } else {
      updateData.completedAt = null
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(and(eq(orders.id, id), eq(orders.userId, user.id)))
      .returning()

    // Webhook Notification Logic
    const WEBHOOK_URL = 'https://n8n.hivebot.cloud/webhook/9b49aa97-0409-45bd-aa80-fc6ffb32608c'
    let message = ''

    if (status === 'Em preparação') {
      message = 'O pedido do cliente está em separação, informe a ele em uma mensagem curta'
    } else if (status === 'Enviado') {
      message = 'O pedido do cliente foi enviado, informe a ele em uma mensagem curta'
    }

    if (message) {
      try {
        await $fetch(WEBHOOK_URL, {
          method: 'POST',
          body: {
            message,
            orderId: updatedOrder.id,
            customerName: updatedOrder.customerName,
            customerPhone: updatedOrder.customerPhone
          }
        })
      } catch (e) {
        console.error('Failed to trigger order status webhook', e)
      }
    }

    return updatedOrder
  }
})

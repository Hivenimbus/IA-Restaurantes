import { defineEventHandler, createError, readBody } from 'h3'
import { auth } from '~~/server/utils/auth'
import { db } from '~~/server/utils/db'
import { orders, orderItems, users } from '~~/server/database/schema'
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

    // Fetch order items to build the message
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, updatedOrder.id))

    // Format items: "2x Completo, 1x Coca 2L"
    const itemsLabel = items.length > 0
      ? items.map(i => `${i.quantity}x ${i.itemName}`).join(', ')
      : 'sem itens'

    // Build status-specific message text
    let statusText = ''
    if (status === 'Em preparação') {
      statusText = 'está em preparação'
    } else if (status === 'Enviado') {
      statusText = 'saiu para entrega'
    } else if (status === 'Entregue') {
      statusText = 'foi entregue'
    } else if (status === 'Cancelado') {
      statusText = 'foi cancelado'
    } else {
      statusText = `mudou para "${status}"`
    }

    const message = `pedido #${updatedOrder.id} (${itemsLabel}) ${statusText}`

    // Fetch the agent webhook URL for this user/restaurant
    const [userRow] = await db
      .select({ agentWebhookUrl: users.agentWebhookUrl })
      .from(users)
      .where(eq(users.id, user.id))

    const webhookUrl = userRow?.agentWebhookUrl

    if (webhookUrl) {
      try {
        await $fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: {
            message,
            to: updatedOrder.customerPhone ?? ''
          }
        })
        console.log(`[Webhook] Sent to ${webhookUrl}: ${message} → ${updatedOrder.customerPhone}`)
      } catch (e) {
        console.error('[Webhook] Failed to trigger order status webhook:', e)
      }
    } else {
      console.log('[Webhook] No agent webhook configured for this restaurant, skipping.')
    }

    return updatedOrder
  }
})

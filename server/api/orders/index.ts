import { defineEventHandler, createError, readBody } from 'h3'
import { auth } from '~~/server/utils/auth'
import { db } from '~~/server/utils/db'
import { orders, orderItems } from '~~/server/database/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers
  })

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const user = session.user

  if (event.method === 'GET') {
    const data = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      orderBy: [desc(orders.createdAt)],
      with: {
        orderItems: true
      }
    })
    return data
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    const { items, ...orderData } = body

    // 1. Create Order
    const [newOrder] = await db
      .insert(orders)
      .values({
        customerName: body.customer_name,
        customerPhone: body.customer_phone,
        address: body.address,
        paymentMethod: body.payment_method,
        status: body.status || 'Aguardando',
        total: body.total,
        observations: body.observations,
        userId: user.id
      })
      .returning()

    // 2. Create Order Items
    if (items && items.length > 0) {
      const dbOrderItems = items.map((item: any) => ({
        orderId: newOrder.id,
        menuItemId: item.menu_item_id,
        itemName: item.item_name,
        itemPrice: item.item_price,
        quantity: item.quantity
      }))

      await db
        .insert(orderItems)
        .values(dbOrderItems)
    }

    return newOrder
  }
})

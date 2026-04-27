import { defineEventHandler, createError, readBody } from 'h3'
import { auth } from '~~/server/utils/auth'
import { db } from '~~/server/utils/db'
import { orders, orderItems, clients, users } from '~~/server/database/schema'
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
    let data = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      orderBy: [desc(orders.createdAt)],
      with: {
        orderItems: true
      }
    })

    // Automatic Mode logic: Check if orders in "Em preparação" should be "Enviado"
    const [userConfig] = await db.select({ isAutomaticMode: users.isAutomaticMode, averageWaitTime: users.averageWaitTime }).from(users).where(eq(users.id, user.id))
    if (userConfig?.isAutomaticMode) {
      const waitTimeMs = (userConfig.averageWaitTime || 30) * 60 * 1000
      const now = Date.now()
      let updatedAny = false

      for (const order of data) {
        if (order.status === 'Em preparação') {
          const orderTime = new Date(order.createdAt).getTime()
          if (now - orderTime >= waitTimeMs) {
            await db.update(orders).set({ status: 'Enviado' }).where(eq(orders.id, order.id))
            order.status = 'Enviado'
            updatedAny = true
          }
        }
      }
    }

    return data
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    const { items, ...orderData } = body

    // Fetch user settings for automatic mode
    const [userConfig] = await db.select({ isAutomaticMode: users.isAutomaticMode }).from(users).where(eq(users.id, user.id))
    const initialStatus = userConfig?.isAutomaticMode ? 'Em preparação' : (body.status || 'Aguardando')

    // 1. Create Order
    const [newOrder] = await db
      .insert(orders)
      .values({
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        address: body.address,
        paymentMethod: body.paymentMethod,
        status: initialStatus,
        total: body.total,
        observations: body.observations,
        userId: user.id
      })
      .returning()

    // 2. Upsert Client (only if phone is provided)
    if (body.customerPhone) {
      const existingClient = await db.query.clients.findFirst({
        where: and(eq(clients.phone, body.customerPhone), eq(clients.userId, user.id))
      })

      if (existingClient) {
        await db.update(clients)
          .set({
            name: body.customerName, // Update name just in case
            address: body.address || existingClient.address,
            lastOrderId: newOrder.id,
            updatedAt: new Date()
          })
          .where(eq(clients.id, existingClient.id))
      } else {
        await db.insert(clients).values({
          name: body.customerName,
          phone: body.customerPhone,
          address: body.address,
          userId: user.id,
          lastOrderId: newOrder.id
        })
      }
    }

    // 3. Create Order Items
    if (items && items.length > 0) {
      const dbOrderItems = items.map((item: any) => ({
        orderId: newOrder.id,
        menuItemId: item.menuItemId,
        itemName: item.itemName,
        itemPrice: item.itemPrice,
        quantity: item.quantity
      }))

      await db
        .insert(orderItems)
        .values(dbOrderItems)
    }

    return newOrder
  }
})

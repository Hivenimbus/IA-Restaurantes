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

    return updatedOrder
  }
})

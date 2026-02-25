import { defineEventHandler, createError, readBody } from 'h3'
import { auth } from '~~/server/utils/auth'
import { db } from '~~/server/utils/db'
import { menuItems } from '~~/server/database/schema'
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
    const { id: _id, createdAt, updatedAt, userId, ...updateData } = body

    const [updatedItem] = await db
      .update(menuItems)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(menuItems.id, id), eq(menuItems.userId, user.id)))
      .returning()

    return updatedItem
  }

  if (event.method === 'DELETE') {
    await db
      .delete(menuItems)
      .where(and(eq(menuItems.id, id), eq(menuItems.userId, user.id)))

    return { success: true }
  }
})

import { defineEventHandler, createError, readBody } from 'h3'
import { auth } from '~~/server/utils/auth'
import { db } from '~~/server/utils/db'
import { menuItems } from '~~/server/database/schema'
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
    const data = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.userId, user.id))
      .orderBy(desc(menuItems.createdAt))

    return data
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    const { id: _id, createdAt, updatedAt, userId, ...insertData } = body

    const [newItem] = await db
      .insert(menuItems)
      .values({ ...insertData, userId: user.id })
      .returning()

    return newItem
  }
})

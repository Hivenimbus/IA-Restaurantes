import { defineEventHandler, createError, readBody } from 'h3'
import { auth } from '~~/server/utils/auth'
import { db } from '~~/server/utils/db'
import { menuSettings } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers
    })

    if (!session) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    const user = session.user

    if (event.method === 'GET') {
        const settings = await db.query.menuSettings.findFirst({
            where: eq(menuSettings.userId, user.id)
        })
        return settings || { menuLink: '', menuFileUrl: '' }
    }

    if (event.method === 'POST') {
        const body = await readBody(event)

        // Upsert logic
        const existing = await db.query.menuSettings.findFirst({
            where: eq(menuSettings.userId, user.id)
        })

        if (existing) {
            const updated = await db.update(menuSettings)
                .set({
                    menuLink: body.menuLink,
                    menuFileUrl: body.menuFileUrl,
                    updatedAt: new Date()
                })
                .where(eq(menuSettings.id, existing.id))
                .returning()
            return updated[0]
        } else {
            const created = await db.insert(menuSettings)
                .values({
                    userId: user.id,
                    menuLink: body.menuLink,
                    menuFileUrl: body.menuFileUrl
                })
                .returning()
            return created[0]
        }
    }
})

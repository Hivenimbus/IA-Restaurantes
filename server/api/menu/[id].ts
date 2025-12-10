import { defineEventHandler, getCookie, createError } from 'h3'
import jwt from 'jsonwebtoken'
import { serverSupabaseClient } from '#supabase/server'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  let user
  try {
    user = jwt.verify(token, JWT_SECRET)
  } catch (e) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid Token' })
  }

  const id = event.context.params?.id
  const client = await serverSupabaseClient(event)

  if (event.method === 'PUT') {
    const body = await readBody(event)
    const { data, error } = await client
      .from('menu_items')
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the item
      .select()
      .single()
    
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return data
  }

  if (event.method === 'DELETE') {
    const { error } = await client
      .from('menu_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the item
    
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return { success: true }
  }
})


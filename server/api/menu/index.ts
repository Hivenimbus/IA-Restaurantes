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

  const client = await serverSupabaseClient(event)

  if (event.method === 'GET') {
    const { data, error } = await client
      .from('menu_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return data
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    const { data, error } = await client
      .from('menu_items')
      .insert({ ...body, user_id: user.id })
      .select()
      .single()
    
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return data
  }
})


import { defineEventHandler, getCookie, createError, readBody } from 'h3'
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
    const { status } = body

    const updateData: any = { status }
    
    // If status is terminal (Entregue/Cancelado), set completed_at
    if (status === 'Entregue' || status === 'Cancelado') {
      updateData.completed_at = new Date().toISOString()
    } else {
      // If moving back to active (optional logic, but safe), clear it
      updateData.completed_at = null
    }

    const { data, error } = await client
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Security check
      .select()
      .single()

    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return data
  }
})

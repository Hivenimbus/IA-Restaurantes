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

  const client = await serverSupabaseClient(event)

  if (event.method === 'GET') {
    const { data: orders, error } = await client
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return orders
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    const { items, ...orderData } = body

    // 1. Create Order
    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({ ...orderData, user_id: user.id })
      .select()
      .single()

    if (orderError) throw createError({ statusCode: 500, statusMessage: orderError.message })

    // 2. Create Order Items
    if (items && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        item_name: item.item_name,
        item_price: item.item_price,
        quantity: item.quantity
      }))

      const { error: itemsError } = await client
        .from('order_items')
        .insert(orderItems)
      
      if (itemsError) throw createError({ statusCode: 500, statusMessage: itemsError.message })
    }

    return order
  }
})


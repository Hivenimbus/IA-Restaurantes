import { defineEventHandler, readBody, createError, setCookie } from 'h3'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { serverSupabaseClient } from '#supabase/server'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email e senha são obrigatórios.'
    })
  }

  const client = await serverSupabaseClient(event)

  // Find user
  const { data: user } = await client
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Email ou senha inválidos.'
    })
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password_hash)
  if (!validPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Email ou senha inválidos.'
    })
  }

  // Generate Token
  const token = jwt.sign(
    { id: user.id, email: user.email, establishment_name: user.establishment_name },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  // Set Cookie
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      establishment_name: user.establishment_name
    }
  }
})


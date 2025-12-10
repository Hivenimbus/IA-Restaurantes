import { defineEventHandler, getCookie, createError } from 'h3'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me'

export default defineEventHandler((event) => {
  const token = getCookie(event, 'auth_token')

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Não autenticado'
    })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return { user: decoded }
  } catch (err) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token inválido'
    })
  }
})


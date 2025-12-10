import { defineEventHandler, readBody, createError } from 'h3'
import bcrypt from 'bcrypt'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password, establishment_name } = body

  if (!email || !password || !establishment_name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email, senha e nome do estabelecimento são obrigatórios.'
    })
  }

  const client = await serverSupabaseClient(event)

  // Check if user already exists
  const { data: existingUser } = await client
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existingUser) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email já cadastrado.'
    })
  }

  // Hash password
  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash(password, salt)

  // Create user
  const { error } = await client
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
      establishment_name
    })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao criar usuário: ' + error.message
    })
  }

  return { success: true }
})


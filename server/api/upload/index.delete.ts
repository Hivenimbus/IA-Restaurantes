import { defineEventHandler, createError, readBody } from 'h3'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { s3Client, BUCKET_NAME } from '~~/server/utils/s3'
import { auth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers
    })

    if (!session) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const body = await readBody(event)
    const { filename } = body

    if (!filename) {
        throw createError({ statusCode: 400, message: 'Filename is required' })
    }

    try {
        console.log('Attempting to delete from S3:', {
            bucket: BUCKET_NAME,
            key: filename
        })

        await s3Client.send(new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: filename
        }))

        console.log('Delete successful for:', filename)

        return { success: true }
    } catch (e) {
        console.error('Delete Error:', e)
        throw createError({ statusCode: 500, message: 'Failed to delete file' })
    }
})

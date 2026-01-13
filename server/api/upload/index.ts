import { defineEventHandler, createError, readMultipartFormData } from 'h3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3Client, BUCKET_NAME } from '~~/server/utils/s3'
import { auth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers
    })

    if (!session) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const files = await readMultipartFormData(event)
    if (!files || !files.length) {
        throw createError({ statusCode: 400, message: 'No file provided' })
    }

    const file = files[0]
    const filename = `${Date.now()}-${file.filename}`

    // Ensure content type is string
    const contentType = file.type || 'application/octet-stream'

    try {
        console.log('Attempting upload to S3:', {
            bucket: BUCKET_NAME,
            key: filename,
            contentType
        })

        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: filename,
            Body: file.data,
            ContentType: contentType,
        }))

        console.log('Upload successful for:', filename)

        // Construct Public URL
        // Note: In production with real S3, you might just stick to bucket URL
        // For Minio/Local:
        const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'
        const endpoint = process.env.MINIO_ENDPOINT
        const port = process.env.MINIO_PORT ? `:${process.env.MINIO_PORT}` : ''

        let url = ''
        if (endpoint?.includes('amazonaws.com')) {
            url = `https://${BUCKET_NAME}.s3.${process.env.MINIO_REGION || 'us-east-1'}.amazonaws.com/${filename}`
        } else {
            url = `${protocol}://${endpoint}${port}/${BUCKET_NAME}/${filename}`
        }

        return { url }
    } catch (e) {
        console.error('Upload Error:', e)
        throw createError({ statusCode: 500, message: 'Upload failed' })
    }
})

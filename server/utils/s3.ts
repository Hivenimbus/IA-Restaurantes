import { S3Client } from '@aws-sdk/client-s3'

const endpoint = process.env.MINIO_ENDPOINT
    ? `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}${process.env.MINIO_PORT ? ':' + process.env.MINIO_PORT : ''}`
    : undefined

console.log('S3 Config:', {
    endpoint,
    bucket: process.env.MINIO_BUCKET || 'cardapios',
    region: process.env.MINIO_REGION
})

export const s3Client = new S3Client({
    region: process.env.MINIO_REGION || 'us-east-1',
    endpoint,
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || '',
        secretAccessKey: process.env.MINIO_SECRET_KEY || ''
    },
    forcePathStyle: true
})

export const BUCKET_NAME = process.env.MINIO_BUCKET || 'cardapios'

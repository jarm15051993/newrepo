import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '@/lib/prisma'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/heic',
  'image/heif',
]

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.heic', '.heif']

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return new NextResponse('userId required', { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePicture: true },
    })

    if (!user?.profilePicture) {
      return new NextResponse('Not found', { status: 404 })
    }

    // Extract the S3 key from the stored URL (e.g. "profile-pictures/userId.jpg")
    const s3Url = new URL(user.profilePicture)
    const key = s3Url.pathname.slice(1)

    const s3Response = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
      })
    )

    if (!s3Response.Body) {
      return new NextResponse('Image not found', { status: 404 })
    }

    const imageBytes = await s3Response.Body.transformToByteArray()

    return new NextResponse(Buffer.from(imageBytes), {
      headers: {
        'Content-Type': s3Response.ContentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error: any) {
    console.error('Profile picture fetch error:', error)
    return new NextResponse('Error fetching image', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and userId are required' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be under 10MB' },
        { status: 400 }
      )
    }

    // Validate by extension
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
    if (!hasValidExtension) {
      return NextResponse.json(
        { error: 'Only .png, .jpg, .jpeg, .heic, and .heif files are allowed' },
        { status: 400 }
      )
    }

    // Validate MIME type (may be empty for HEIC on some browsers — allow if extension is valid)
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only .png, .jpg, .jpeg, .heic, and .heif files are allowed' },
        { status: 400 }
      )
    }

    // Build S3 key
    const ext = ALLOWED_EXTENSIONS.find(e => fileName.endsWith(e)) || '.jpg'
    const key = `profile-pictures/${userId}${ext}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type || 'image/jpeg',
      })
    )

    const profilePictureUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: { profilePicture: profilePictureUrl },
    })

    return NextResponse.json({ profilePicture: profilePictureUrl })
  } catch (error: any) {
    console.error('Profile picture upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

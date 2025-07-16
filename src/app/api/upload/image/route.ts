import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})


interface CloudinaryUploadResult {
    secure_url: string
    public_id: string
    width: number
    height: number
    bytes: number
    format: string
    resource_type: string
}

interface CloudinaryDestroyResult {
    result: 'ok' | 'not found'
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('image') as File | null

        /* ------- validations ------- */
        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowed.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only JPEG / PNG / GIF / WebP allowed.' },
                { status: 400 },
            )
        }

        const maxSize = 10 * 1024 * 1024 // 10 MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10 MB.' },
                { status: 400 },
            )
        }

        /* ------- convert File → Buffer ------- */
        const buffer = Buffer.from(await file.arrayBuffer())

        /* ------- upload to Cloudinary ------- */
        const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: 'image',
                    folder: 'quiz-questions',
                    transformation: [
                        { width: 1200, height: 800, crop: 'limit' },
                        { quality: 'auto' },
                        { fetch_format: 'auto' },
                    ],
                },
                (error, res) => {
                    if (error) reject(error)
                    else if (res) resolve(res as unknown as CloudinaryUploadResult)
                    else reject(new Error('Upload failed: empty response'))
                },
            ).end(buffer)
        })

        return NextResponse.json(
            {
                success: true,
                imageUrl: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
            },
            { status: 201 },
        )
    } catch (err) {
        console.error('Cloudinary upload error:', err)
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }
}


export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const publicId = searchParams.get('publicId')

        if (!publicId) {
            return NextResponse.json({ error: 'No publicId provided' }, { status: 400 })
        }

        const result = await cloudinary.uploader.destroy(publicId) as CloudinaryDestroyResult

        return NextResponse.json({ success: true, result: result.result }, { status: 200 })
    } catch (err) {
        console.error('Cloudinary delete error:', err)
        return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
    }
}


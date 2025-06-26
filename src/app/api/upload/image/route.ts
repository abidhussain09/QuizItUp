import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('image') as unknown as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ 
                error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' 
            }, { status: 400 });
        }

        // Validate file size (10MB limit for Cloudinary)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json({ 
                error: 'File too large. Maximum size is 10MB.' 
            }, { status: 400 });
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const uploadResponse = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: 'image',
                    folder: 'quiz-questions', // Organize uploads in a folder
                    transformation: [
                        { width: 1200, height: 800, crop: 'limit' }, // Limit max dimensions
                        { quality: 'auto' }, // Auto optimize quality
                        { fetch_format: 'auto' } // Auto format (WebP when supported)
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });

        const result = uploadResponse as any;

        return NextResponse.json({
            success: true,
            imageUrl: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height
        });

    } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        return NextResponse.json({ 
            error: 'Failed to upload image' 
        }, { status: 500 });
    }
}

// Optional: Add DELETE endpoint to remove images from Cloudinary
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const publicId = searchParams.get('publicId');

        if (!publicId) {
            return NextResponse.json({ error: 'No publicId provided' }, { status: 400 });
        }

        // Delete from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);
        
        return NextResponse.json({ 
            success: true, 
            result: result.result 
        });
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        return NextResponse.json({ 
            error: 'Failed to delete image' 
        }, { status: 500 });
    }
}

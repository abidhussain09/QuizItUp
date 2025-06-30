'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Loader2, Upload } from 'lucide-react';
import axios from '@/lib/axios';

interface ImageUploadProps {
    onImageUpload: (imageUrl: string) => void;
    onImageRemove: () => void;
    currentImageUrl?: string;
    disabled?: boolean;
}

export default function ImageUpload({ 
    onImageUpload, 
    onImageRemove, 
    currentImageUrl, 
    disabled = false 
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
            return;
        }

        // Validate file size (10MB limit for Cloudinary)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            setError('File too large. Maximum size is 10MB.');
            return;
        }

        setError('');
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await axios.post('/api/upload/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                onImageUpload(response.data.imageUrl);
            } else {
                setError(response.data.error || 'Upload failed');
            }
        } catch (err: unknown) {
            console.error('Upload error:', err);
            const error = err as { response?: { data?: { error?: string } } };
            setError(error.response?.data?.error || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleRemoveImage = () => {
        onImageRemove();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setError('');
    };

    return (
        <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Question Image (Optional)
            </Label>
            
            {currentImageUrl ? (
                // Show uploaded image
                <div className="relative">
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                        <Image
                            src={currentImageUrl}
                            alt="Question image"
                            width={800}
                            height={600}
                            className="max-w-full h-auto max-h-64 mx-auto rounded-lg shadow-sm"
                            onError={() => {
                                console.error('Image failed to load:', currentImageUrl);
                                setError('Failed to load image. Please try uploading again.');
                            }}
                        />
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 shadow-lg"
                        onClick={handleRemoveImage}
                        disabled={disabled}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                // Show upload area
                <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragOver
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-purple-400'}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                        disabled={disabled || uploading}
                    />
                    
                    {uploading ? (
                        <div className="flex flex-col items-center space-y-2">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Uploading to Cloudinary...
                            </p>
                            <p className="text-xs text-gray-500">
                                This may take a few seconds
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-2">
                            <Upload className="h-8 w-8 text-gray-400" />
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium text-purple-600 hover:text-purple-500">
                                    Click to upload
                                </span>{' '}
                                or drag and drop
                            </div>
                            <p className="text-xs text-gray-500">
                                PNG, JPG, GIF, WebP up to 10MB
                            </p>
                            <p className="text-xs text-gray-400">
                                Images will be optimized automatically
                            </p>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}

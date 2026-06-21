'use client'

import { useState, useEffect } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MultiImageUploadProps {
  value?: string[] // Current image URLs
  onChange: (urls: string[]) => void
  label?: string
  maxImages?: number
  aspectRatio?: string // e.g. "16/9", "1/1", "4/3"
}

export function MultiImageUpload({
  value = [],
  onChange,
  label = 'Images',
  maxImages = 5,
  aspectRatio,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>(value)

  useEffect(() => {
    setImages(value)
  }, [value])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (images.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`)
      return
    }

    // Validate all files
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select only image files')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Each image must be less than 5MB')
        return
      }
    }

    setUploading(true)
    const uploadedUrls: string[] = []

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Upload failed')
        }

        const data = await res.json()
        uploadedUrls.push(data.url)
      }

      const newImages = [...images, ...uploadedUrls]
      setImages(newImages)
      onChange(newImages)
      toast.success(`${files.length} image(s) uploaded successfully`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onChange(newImages)
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [removed] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, removed)
    setImages(newImages)
    onChange(newImages)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label} ({images.length}/{maxImages})
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <div
                className="relative overflow-hidden rounded-lg border bg-muted"
                style={aspectRatio ? { aspectRatio } : { aspectRatio: '1/1' }}
              >
                <img
                  src={url}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                  {index === 0 ? 'Main' : index + 1}
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
                disabled={uploading}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              {index > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 left-2 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleReorder(index, 0)}
                  disabled={uploading}
                >
                  Make Main
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <label
          className={cn(
            'flex flex-col items-center justify-center',
            'border-2 border-dashed rounded-lg',
            'cursor-pointer hover:bg-muted/50 transition-colors',
            uploading ? 'opacity-50 cursor-not-allowed' : '',
            images.length === 0 && aspectRatio ? '' : 'min-h-[120px]'
          )}
          style={images.length === 0 && aspectRatio ? { aspectRatio } : {}}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          )}
          <p className="text-sm text-muted-foreground">
            {uploading ? 'Uploading...' : 'Click to upload images'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, WebP or GIF (max 5MB each)
          </p>
        </label>
      )}
    </div>
  )
}

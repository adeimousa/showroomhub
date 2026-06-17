'use client'

import { useState } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ImageUploadProps {
  value?: string // Current image URL
  onChange: (url: string) => void
  label?: string
  aspectRatio?: string // e.g. "16/9", "1/1", "4/3"
}

export function ImageUpload({ value, onChange, label = 'Image', aspectRatio }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to server
    setUploading(true)
    try {
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
      onChange(data.url)
      setPreview(data.url)
      toast.success('Image uploaded successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image')
      setPreview(value || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange('')
    toast.success('Image removed')
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>

      {preview ? (
        <div className="relative group">
          <div
            className="relative overflow-hidden rounded-lg border bg-muted"
            style={aspectRatio ? { aspectRatio } : { maxHeight: '300px' }}
          >
            <img
              src={preview}
              alt="Upload preview"
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label
          className={`
            flex flex-col items-center justify-center
            border-2 border-dashed rounded-lg
            cursor-pointer hover:bg-muted/50 transition-colors
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={aspectRatio ? { aspectRatio } : { minHeight: '200px' }}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          {uploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-2" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          )}
          <p className="text-sm text-muted-foreground">
            {uploading ? 'Uploading...' : 'Click to upload image'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, WebP or GIF (max 5MB)
          </p>
        </label>
      )}
    </div>
  )
}

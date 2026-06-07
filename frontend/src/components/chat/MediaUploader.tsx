'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, Image as ImageIcon, FileIcon, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileUpload, validateMediaFile } from '@/hooks/useFileUpload';
import { toast } from 'sonner';

interface MediaUploaderProps {
  onUpload?: (fileUrl: string, fileType: string, fileName: string, size: number) => void;
  onError?: (error: string) => void;
  acceptedTypes?: string;
  maxSize?: number;
}

export const MediaUploader = ({
  onUpload,
  onError,
  acceptedTypes = 'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
  maxSize = 52428800,
}: MediaUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; type: string; name: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { uploadFile, uploading, progress, error } = useFileUpload();

  const getPreviewUrl = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file
      const validation = validateMediaFile(file, maxSize);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file');
        onError?.(validation.error || 'Invalid file');
        return;
      }

      // Generate preview
      const previewUrl = await getPreviewUrl(file);
      setPreview({
        url: previewUrl,
        type: validation.type || 'document',
        name: file.name,
      });
    },
    [maxSize, onError, getPreviewUrl]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleUpload = useCallback(async () => {
    if (!preview) return;

    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      const result = await uploadFile(file);
      if (result) {
        onUpload?.(result.url, result.fileType, result.fileName, result.fileSize);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        toast.success('Media uploaded successfully');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    }
  }, [preview, uploadFile, onUpload]);

  const handleCancel = useCallback(() => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Preview idle state
  if (!preview) {
    return (
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors',
          dragActive ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          accept={acceptedTypes}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 px-4 py-6 text-center"
        >
          <Upload size={32} className="text-[hsl(var(--muted-foreground))]" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">
              Click to upload or drag & drop
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Images, videos, or documents (max {(maxSize / 1024 / 1024).toFixed(0)}MB)
            </p>
          </div>
        </button>
      </div>
    );
  }

  // Preview with send/cancel
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
      <div className="mb-3 flex items-start gap-3">
        {/* Preview thumbnail */}
        <div className="shrink-0">
          {preview.type === 'image' ? (
            <img src={preview.url} alt={preview.name} className="h-16 w-16 rounded-lg object-cover" />
          ) : preview.type === 'video' ? (
            <div className="relative h-16 w-16 rounded-lg bg-[hsl(var(--muted))]">
              <video src={preview.url} className="h-full w-full object-cover rounded-lg" />
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
                <span className="text-xs font-bold text-white">VIDEO</span>
              </div>
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[hsl(var(--muted))]">
              <FileIcon size={24} className="text-[hsl(var(--muted-foreground))]" />
            </div>
          )}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">{preview.name}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{preview.type}</p>

          {/* Upload progress */}
          {uploading && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                <div
                  className="h-full bg-[hsl(var(--primary))] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">{progress}%</span>
            </div>
          )}

          {/* Error message */}
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        {/* Cancel button */}
        {!uploading && (
          <button
            onClick={handleCancel}
            className="shrink-0 rounded-full p-1 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Action buttons */}
      {!uploading && (
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm font-medium text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))]"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            className="flex-1 rounded-lg bg-[hsl(var(--primary))] px-3 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] transition hover:opacity-90"
          >
            Send
          </button>
        </div>
      )}

      {uploading && (
        <div className="flex items-center justify-center gap-2">
          <Loader size={16} className="animate-spin" />
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Uploading...</span>
        </div>
      )}
    </div>
  );
};

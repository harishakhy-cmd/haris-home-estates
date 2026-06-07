import { useState, useCallback } from 'react';

interface FileUploadState {
  progress: number;
  uploading: boolean;
  error: string | null;
  fileName: string | null;
}

interface FileUploadResult {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export const useFileUpload = () => {
  const [state, setState] = useState<FileUploadState>({
    progress: 0,
    uploading: false,
    error: null,
    fileName: null,
  });

  const uploadFile = useCallback(
    async (file: File, endpoint: string = '/chat/upload'): Promise<FileUploadResult | null> => {
      try {
        setState({ progress: 0, uploading: true, error: null, fileName: file.name });

        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setState((prev) => ({ ...prev, progress: percent }));
          }
        });

        // Handle completion
        return new Promise((resolve, reject) => {
          xhr.addEventListener('load', () => {
            if (xhr.status === 200 || xhr.status === 201) {
              const response = JSON.parse(xhr.responseText);
              setState({ progress: 100, uploading: false, error: null, fileName: null });
              resolve({
                url: response.url || response.data?.url,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
              });
            } else {
              const error = `Upload failed: ${xhr.status}`;
              setState({ progress: 0, uploading: false, error, fileName: null });
              reject(new Error(error));
            }
          });

          xhr.addEventListener('error', () => {
            const error = 'Network error during upload';
            setState({ progress: 0, uploading: false, error, fileName: null });
            reject(new Error(error));
          });

          xhr.addEventListener('abort', () => {
            const error = 'Upload cancelled';
            setState({ progress: 0, uploading: false, error, fileName: null });
            reject(new Error(error));
          });

          xhr.open('POST', endpoint);
          // Don't set Content-Type - browser will set it with boundary for multipart/form-data

          // Get token from localStorage for auth
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }

          xhr.send(formData);
        });
      } catch (err: any) {
        const error = err?.message || 'Upload failed';
        setState({ progress: 0, uploading: false, error, fileName: null });
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ progress: 0, uploading: false, error: null, fileName: null });
  }, []);

  return {
    ...state,
    uploadFile,
    reset,
  };
};

export const validateMediaFile = (file: File, maxSize: number = 52428800): { valid: boolean; error?: string; type?: string } => {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Max size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`,
    };
  }

  // Get file type
  const mimeType = file.type;
  let fileType = '';

  if (mimeType.startsWith('image/')) {
    fileType = 'image';
  } else if (mimeType.startsWith('video/')) {
    fileType = 'video';
  } else if (
    mimeType === 'application/pdf' ||
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType.includes('sheet') ||
    mimeType.includes('presentation')
  ) {
    fileType = 'document';
  } else if (mimeType.startsWith('audio/')) {
    fileType = 'audio';
  } else {
    return {
      valid: false,
      error: 'Unsupported file type',
    };
  }

  return { valid: true, type: fileType };
};

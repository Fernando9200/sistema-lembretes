// src/hooks/useCloudinaryUpload.ts
import { useState } from 'react';

interface UploadResult {
  url: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  resourceType: 'image' | 'video' | 'raw';
}

interface UseCloudinaryUploadReturn {
  uploading: boolean;
  uploadFile: (file: File) => Promise<UploadResult>;
  error: string | null;
}

export const useCloudinaryUpload = (): UseCloudinaryUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<UploadResult> => {
    setUploading(true);
    setError(null);

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error('Configuração do Cloudinary não encontrada');
      }

      // Determina o tipo de recurso baseado no tipo de arquivo
      let resourceType: 'image' | 'video' | 'raw' = 'raw';
      if (file.type.startsWith('image/')) {
        resourceType = 'image';
      } else if (file.type.startsWith('video/')) {
        resourceType = 'video';
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('resource_type', resourceType);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Falha no upload do arquivo');
      }

      const result = await response.json();

      return {
        url: result.secure_url,
        publicId: result.public_id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        resourceType,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido no upload';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { uploading, uploadFile, error };
};
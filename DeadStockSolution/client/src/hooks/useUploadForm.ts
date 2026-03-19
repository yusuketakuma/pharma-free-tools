import { useState, useRef, useCallback, useMemo } from 'react';
import { resolveSubmittedMapping, type PreviewResponse } from './useUploadPreview';
import type { UploadType } from '../pages/upload/upload-job-utils';

export interface UseUploadFormOptions {
  preview: PreviewResponse | null;
}

export interface UseUploadFormReturn {
  file: File | null;
  fileRef: React.RefObject<HTMLInputElement>;
  uploadType: UploadType;
  setUploadType: (value: UploadType) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  clearFile: () => void;
  resetForm: () => void;
  applyPreviewUploadType: (nextPreview: PreviewResponse) => void;
  resolveCurrentMapping: () => Record<string, string | null> | null;
  hasPreviewRows: boolean;
  hasResolvableMapping: boolean;
  hasManualTypeOverride: boolean;
}

/**
 * Upload form state hook.
 * Keeps file/uploadType state and exposes mapping-related derived values.
 */
export function useUploadForm({ preview }: UseUploadFormOptions): UseUploadFormReturn {
  const [file, setFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<UploadType>('dead_stock');
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedUploadTypeMapping = useMemo(
    () => resolveSubmittedMapping(preview, uploadType),
    [preview, uploadType],
  );

  const hasPreviewRows = (preview?.rows.length ?? 0) > 0;
  const hasResolvableMapping = selectedUploadTypeMapping !== null;
  const hasManualTypeOverride = Boolean(preview && uploadType !== preview.resolvedUploadType);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    if (fileRef.current) {
      fileRef.current.value = '';
    }
  }, []);

  const resetForm = useCallback(() => {
    clearFile();
    setUploadType('dead_stock');
  }, [clearFile]);

  const applyPreviewUploadType = useCallback((nextPreview: PreviewResponse) => {
    setUploadType(nextPreview.resolvedUploadType);
  }, []);

  const resolveCurrentMapping = useCallback(() => selectedUploadTypeMapping, [selectedUploadTypeMapping]);

  return {
    file,
    fileRef,
    uploadType,
    setUploadType,
    handleFileChange,
    clearFile,
    resetForm,
    applyPreviewUploadType,
    resolveCurrentMapping,
    hasPreviewRows,
    hasResolvableMapping,
    hasManualTypeOverride,
  };
}

import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type React from 'react';
import { useUploadForm } from '../useUploadForm';
import type { PreviewResponse } from '../useUploadPreview';

function buildPreview(overrides: Partial<PreviewResponse> = {}): PreviewResponse {
  return {
    headers: ['JAN', '名称'],
    rows: [['490000000001', 'テスト薬']],
    suggestedMapping: { janCode: 'JAN', medicationName: '名称' },
    suggestedMappingByType: {
      dead_stock: { janCode: 'JAN', medicationName: '名称' },
      used_medication: null,
    },
    headerRowIndex: 0,
    hasSavedMapping: false,
    detectedUploadType: 'dead_stock',
    resolvedUploadType: 'dead_stock',
    rememberedUploadType: null,
    uploadTypeConfidence: 'high',
    uploadTypeScores: {
      dead_stock: 0.9,
      used_medication: 0.1,
    },
    ...overrides,
  };
}

describe('useUploadForm', () => {
  it('初期状態を保持する', () => {
    const { result } = renderHook(() => useUploadForm({ preview: null }));

    expect(result.current.file).toBeNull();
    expect(result.current.uploadType).toBe('dead_stock');
    expect(result.current.hasPreviewRows).toBe(false);
    expect(result.current.hasResolvableMapping).toBe(false);
    expect(result.current.hasManualTypeOverride).toBe(false);
  });

  it('ファイル変更でfile状態を更新する', () => {
    const preview = buildPreview();
    const { result } = renderHook(() => useUploadForm({ preview }));
    const file = new File(['dummy'], 'upload.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    act(() => {
      result.current.handleFileChange({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.file).toBe(file);
  });

  it('選択種別ごとにマッピング解決と手動オーバーライド判定を行う', () => {
    const preview = buildPreview();
    const { result } = renderHook(() => useUploadForm({ preview }));

    expect(result.current.hasPreviewRows).toBe(true);
    expect(result.current.hasResolvableMapping).toBe(true);
    expect(result.current.resolveCurrentMapping()).toEqual({ janCode: 'JAN', medicationName: '名称' });
    expect(result.current.hasManualTypeOverride).toBe(false);

    act(() => {
      result.current.setUploadType('used_medication');
    });

    expect(result.current.hasResolvableMapping).toBe(false);
    expect(result.current.resolveCurrentMapping()).toBeNull();
    expect(result.current.hasManualTypeOverride).toBe(true);
  });

  it('preview適用とresetでフォーム状態を初期化する', () => {
    const preview = buildPreview({ resolvedUploadType: 'used_medication' });
    const { result } = renderHook(() => useUploadForm({ preview }));
    const file = new File(['dummy'], 'upload.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    act(() => {
      result.current.handleFileChange({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.applyPreviewUploadType(preview);
    });

    expect(result.current.file).toBe(file);
    expect(result.current.uploadType).toBe('used_medication');

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.file).toBeNull();
    expect(result.current.uploadType).toBe('dead_stock');
  });
});

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCertificateRequestSearchParams, useCertificateIssueSearchParams } from '../useCertificates';

describe('useCertificateRequestSearchParams', () => {
  it('should build request query params with status and typeCode', () => {
    const { result } = renderHook(() => useCertificateRequestSearchParams(20));

    act(() => {
      result.current.setStatus('APPROVED');
      result.current.setTypeCode('EMPLOYMENT');
    });

    expect(result.current.params).toEqual({
      page: 0,
      size: 20,
      status: 'APPROVED',
      typeCode: 'EMPLOYMENT',
    });
  });

  it('should reset request filters', () => {
    const { result } = renderHook(() => useCertificateRequestSearchParams(20));

    act(() => {
      result.current.setStatus('ISSUED');
      result.current.setTypeCode('SALARY');
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.params).toEqual({
      page: 0,
      size: 20,
    });
  });
});

describe('useCertificateIssueSearchParams', () => {
  it('should exclude includeExpired=false from query params', () => {
    const { result } = renderHook(() => useCertificateIssueSearchParams(10));

    act(() => {
      result.current.setTypeCode('EMPLOYMENT');
    });

    expect(result.current.params).toEqual({
      page: 0,
      size: 10,
      typeCode: 'EMPLOYMENT',
    });
  });

  it('should include includeExpired=true when enabled', () => {
    const { result } = renderHook(() => useCertificateIssueSearchParams(10));

    act(() => {
      result.current.setTypeCode('EMPLOYMENT');
      result.current.setIncludeExpired(true);
    });

    expect(result.current.params).toEqual({
      page: 0,
      size: 10,
      typeCode: 'EMPLOYMENT',
      includeExpired: true,
    });
  });
});

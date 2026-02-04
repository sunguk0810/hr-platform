package com.hrsaas.mdm.service;

import com.hrsaas.mdm.domain.dto.request.CodeSearchRequest;
import com.hrsaas.mdm.domain.dto.response.SimilarCodeResponse;

import java.util.List;

/**
 * 코드 검색 서비스
 * Levenshtein 거리 기반 유사도 검색을 제공합니다.
 */
public interface CodeSearchService {

    /**
     * 유사 코드 검색
     * 코드명, 코드, 설명 등에서 유사한 코드를 검색합니다.
     */
    List<SimilarCodeResponse> searchSimilar(CodeSearchRequest request);

    /**
     * 중복 코드 검사
     * 동일하거나 매우 유사한 코드가 있는지 확인합니다.
     */
    List<SimilarCodeResponse> checkDuplicate(String groupCode, String codeName);

    /**
     * 코드명으로 전문 검색
     */
    List<SimilarCodeResponse> searchByCodeName(String keyword, String groupCode);

    /**
     * Levenshtein 거리 계산
     */
    int calculateLevenshteinDistance(String s1, String s2);

    /**
     * 유사도 계산 (0.0 ~ 1.0)
     */
    double calculateSimilarity(String s1, String s2);
}

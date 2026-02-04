package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.request.CodeSearchRequest;
import com.hrsaas.mdm.domain.dto.response.SimilarCodeResponse;
import com.hrsaas.mdm.domain.entity.CommonCode;
import com.hrsaas.mdm.repository.CommonCodeRepository;
import com.hrsaas.mdm.service.CodeSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CodeSearchServiceImpl implements CodeSearchService {

    private final CommonCodeRepository commonCodeRepository;

    @Override
    public List<SimilarCodeResponse> searchSimilar(CodeSearchRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        String keyword = request.getKeyword().toLowerCase();
        double threshold = request.getSimilarityThreshold();
        int maxResults = request.getMaxResults();

        List<CommonCode> allCodes;
        if (request.getGroupCode() != null && !request.getGroupCode().isEmpty()) {
            allCodes = commonCodeRepository.findByGroupCode(request.getGroupCode(), tenantId);
        } else {
            allCodes = commonCodeRepository.findAllByTenantId(tenantId);
        }

        if (Boolean.TRUE.equals(request.getActiveOnly())) {
            allCodes = allCodes.stream()
                .filter(CommonCode::isActive)
                .collect(Collectors.toList());
        }

        List<SimilarCodeResponse> results = new ArrayList<>();

        for (CommonCode code : allCodes) {
            SimilarCodeResponse bestMatch = findBestMatch(code, keyword);
            if (bestMatch != null && bestMatch.getSimilarity() >= threshold) {
                results.add(bestMatch);
            }
        }

        // Sort by similarity descending
        results.sort((a, b) -> Double.compare(b.getSimilarity(), a.getSimilarity()));

        // Limit results
        if (results.size() > maxResults) {
            results = results.subList(0, maxResults);
        }

        log.debug("Found {} similar codes for keyword: {}", results.size(), keyword);
        return results;
    }

    @Override
    public List<SimilarCodeResponse> checkDuplicate(String groupCode, String codeName) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<CommonCode> codes = commonCodeRepository.findByGroupCode(groupCode, tenantId);

        String lowerCodeName = codeName.toLowerCase();
        double highThreshold = 0.85; // High threshold for duplicate detection

        List<SimilarCodeResponse> duplicates = new ArrayList<>();

        for (CommonCode code : codes) {
            double similarity = calculateSimilarity(
                lowerCodeName,
                code.getCodeName().toLowerCase()
            );

            if (similarity >= highThreshold) {
                duplicates.add(SimilarCodeResponse.from(code, similarity, "codeName"));
            }
        }

        duplicates.sort((a, b) -> Double.compare(b.getSimilarity(), a.getSimilarity()));

        log.debug("Found {} potential duplicates for codeName: {}", duplicates.size(), codeName);
        return duplicates;
    }

    @Override
    public List<SimilarCodeResponse> searchByCodeName(String keyword, String groupCode) {
        CodeSearchRequest request = CodeSearchRequest.builder()
            .keyword(keyword)
            .groupCode(groupCode)
            .similarityThreshold(0.5)
            .maxResults(50)
            .activeOnly(true)
            .build();

        return searchSimilar(request);
    }

    @Override
    public int calculateLevenshteinDistance(String s1, String s2) {
        if (s1 == null || s2 == null) {
            return Integer.MAX_VALUE;
        }

        int m = s1.length();
        int n = s2.length();

        // Create distance matrix
        int[][] dp = new int[m + 1][n + 1];

        // Initialize first column
        for (int i = 0; i <= m; i++) {
            dp[i][0] = i;
        }

        // Initialize first row
        for (int j = 0; j <= n; j++) {
            dp[0][j] = j;
        }

        // Fill the matrix
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;

                dp[i][j] = Math.min(
                    Math.min(dp[i - 1][j] + 1,      // deletion
                             dp[i][j - 1] + 1),     // insertion
                    dp[i - 1][j - 1] + cost         // substitution
                );
            }
        }

        return dp[m][n];
    }

    @Override
    public double calculateSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) {
            return 0.0;
        }

        if (s1.isEmpty() && s2.isEmpty()) {
            return 1.0;
        }

        if (s1.isEmpty() || s2.isEmpty()) {
            return 0.0;
        }

        // Exact match
        if (s1.equals(s2)) {
            return 1.0;
        }

        // Contains match gets a bonus
        if (s1.contains(s2) || s2.contains(s1)) {
            int distance = calculateLevenshteinDistance(s1, s2);
            int maxLen = Math.max(s1.length(), s2.length());
            double baseSimilarity = 1.0 - ((double) distance / maxLen);
            return Math.min(1.0, baseSimilarity + 0.1); // 10% bonus for contains
        }

        int distance = calculateLevenshteinDistance(s1, s2);
        int maxLen = Math.max(s1.length(), s2.length());

        return 1.0 - ((double) distance / maxLen);
    }

    private SimilarCodeResponse findBestMatch(CommonCode code, String keyword) {
        double bestSimilarity = 0.0;
        String matchedField = null;

        // Check code
        double codeSimilarity = calculateSimilarity(keyword, code.getCode().toLowerCase());
        if (codeSimilarity > bestSimilarity) {
            bestSimilarity = codeSimilarity;
            matchedField = "code";
        }

        // Check codeName
        double codeNameSimilarity = calculateSimilarity(keyword, code.getCodeName().toLowerCase());
        if (codeNameSimilarity > bestSimilarity) {
            bestSimilarity = codeNameSimilarity;
            matchedField = "codeName";
        }

        // Check codeNameEn
        if (code.getCodeNameEn() != null) {
            double codeNameEnSimilarity = calculateSimilarity(keyword, code.getCodeNameEn().toLowerCase());
            if (codeNameEnSimilarity > bestSimilarity) {
                bestSimilarity = codeNameEnSimilarity;
                matchedField = "codeNameEn";
            }
        }

        // Check description
        if (code.getDescription() != null) {
            double descSimilarity = calculateSimilarity(keyword, code.getDescription().toLowerCase());
            if (descSimilarity > bestSimilarity) {
                bestSimilarity = descSimilarity;
                matchedField = "description";
            }
        }

        if (matchedField == null) {
            return null;
        }

        return SimilarCodeResponse.from(code, bestSimilarity, matchedField);
    }
}

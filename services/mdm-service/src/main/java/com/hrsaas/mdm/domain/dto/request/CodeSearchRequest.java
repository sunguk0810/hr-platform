package com.hrsaas.mdm.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeSearchRequest {

    @NotBlank(message = "검색어를 입력해주세요.")
    @Size(min = 1, max = 100, message = "검색어는 1~100자여야 합니다.")
    private String keyword;

    private String groupCode;

    @Builder.Default
    private Double similarityThreshold = 0.6;

    @Builder.Default
    private Integer maxResults = 20;

    @Builder.Default
    private Boolean activeOnly = true;
}

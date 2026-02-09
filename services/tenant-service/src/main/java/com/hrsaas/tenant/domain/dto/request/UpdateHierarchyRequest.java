package com.hrsaas.tenant.domain.dto.request;

import com.hrsaas.tenant.domain.dto.response.OrganizationLevelDto;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateHierarchyRequest {

    @NotEmpty(message = "조직 레벨 목록은 필수입니다.")
    private List<OrganizationLevelDto> levels;
}

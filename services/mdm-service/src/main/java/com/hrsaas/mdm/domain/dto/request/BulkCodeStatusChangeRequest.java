package com.hrsaas.mdm.domain.dto.request;

import com.hrsaas.mdm.domain.entity.CodeStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * 일괄 코드 상태 변경 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkCodeStatusChangeRequest {

    @NotNull(message = "대상 상태는 필수입니다")
    private CodeStatus targetStatus;

    @NotNull(message = "코드 ID 목록은 필수입니다")
    @Size(min = 1, max = 1000, message = "코드 ID는 1~1000개까지 지정할 수 있습니다")
    private List<UUID> codeIds;
}

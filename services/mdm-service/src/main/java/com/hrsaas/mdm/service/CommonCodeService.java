package com.hrsaas.mdm.service;

import com.hrsaas.mdm.domain.dto.request.CreateCommonCodeRequest;
import com.hrsaas.mdm.domain.dto.request.UpdateCommonCodeRequest;
import com.hrsaas.mdm.domain.dto.response.CodeTreeResponse;
import com.hrsaas.mdm.domain.dto.response.CommonCodeResponse;
import com.hrsaas.mdm.domain.entity.CodeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface CommonCodeService {

    CommonCodeResponse create(CreateCommonCodeRequest request);

    CommonCodeResponse getById(UUID id);

    Page<CommonCodeResponse> getAll(String keyword, String groupCode, CodeStatus status, Pageable pageable);

    List<CommonCodeResponse> getByGroupCode(String groupCode);

    CommonCodeResponse getByGroupAndCode(String groupCode, String code);

    CommonCodeResponse update(UUID id, UpdateCommonCodeRequest request);

    CommonCodeResponse activate(UUID id);

    CommonCodeResponse deactivate(UUID id);

    CommonCodeResponse deprecate(UUID id);

    void delete(UUID id);

    /**
     * 계층형 코드 트리 조회
     */
    List<CodeTreeResponse> getCodeTree(String groupCode);
}

package com.hrsaas.mdm.service;

import com.hrsaas.mdm.domain.dto.request.CreateCodeGroupRequest;
import com.hrsaas.mdm.domain.dto.request.UpdateCodeGroupRequest;
import com.hrsaas.mdm.domain.dto.response.CodeGroupResponse;

import java.util.List;
import java.util.UUID;

public interface CodeGroupService {

    CodeGroupResponse create(CreateCodeGroupRequest request);

    CodeGroupResponse getByGroupCode(String groupCode);

    List<CodeGroupResponse> getAll();

    /**
     * 코드 그룹 수정
     */
    CodeGroupResponse update(UUID id, UpdateCodeGroupRequest request);

    void delete(UUID id);
}

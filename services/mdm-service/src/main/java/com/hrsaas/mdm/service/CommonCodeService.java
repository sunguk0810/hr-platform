package com.hrsaas.mdm.service;

import com.hrsaas.mdm.domain.dto.request.CreateCommonCodeRequest;
import com.hrsaas.mdm.domain.dto.response.CommonCodeResponse;

import java.util.List;
import java.util.UUID;

public interface CommonCodeService {

    CommonCodeResponse create(CreateCommonCodeRequest request);

    List<CommonCodeResponse> getByGroupCode(String groupCode);

    CommonCodeResponse getByGroupAndCode(String groupCode, String code);

    CommonCodeResponse activate(UUID id);

    CommonCodeResponse deactivate(UUID id);

    void delete(UUID id);
}

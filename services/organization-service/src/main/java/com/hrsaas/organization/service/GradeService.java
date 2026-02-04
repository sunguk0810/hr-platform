package com.hrsaas.organization.service;

import com.hrsaas.organization.domain.dto.request.CreateGradeRequest;
import com.hrsaas.organization.domain.dto.request.UpdateGradeRequest;
import com.hrsaas.organization.domain.dto.response.GradeResponse;

import java.util.List;
import java.util.UUID;

public interface GradeService {

    GradeResponse create(CreateGradeRequest request);

    GradeResponse getById(UUID id);

    GradeResponse getByCode(String code);

    List<GradeResponse> getAll();

    List<GradeResponse> getActive();

    GradeResponse update(UUID id, UpdateGradeRequest request);

    void delete(UUID id);
}

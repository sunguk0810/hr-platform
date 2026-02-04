package com.hrsaas.organization.service;

import com.hrsaas.organization.domain.dto.request.CreatePositionRequest;
import com.hrsaas.organization.domain.dto.request.UpdatePositionRequest;
import com.hrsaas.organization.domain.dto.response.PositionResponse;

import java.util.List;
import java.util.UUID;

public interface PositionService {

    PositionResponse create(CreatePositionRequest request);

    PositionResponse getById(UUID id);

    PositionResponse getByCode(String code);

    List<PositionResponse> getAll();

    List<PositionResponse> getActive();

    PositionResponse update(UUID id, UpdatePositionRequest request);

    void delete(UUID id);
}

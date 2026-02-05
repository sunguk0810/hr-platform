package com.hrsaas.organization.service;

import com.hrsaas.organization.domain.dto.request.CreateAnnouncementRequest;
import com.hrsaas.organization.domain.dto.request.UpdateAnnouncementRequest;
import com.hrsaas.organization.domain.dto.response.AnnouncementResponse;
import com.hrsaas.organization.domain.entity.AnnouncementCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface AnnouncementService {

    AnnouncementResponse create(CreateAnnouncementRequest request);

    AnnouncementResponse getById(UUID id);

    Page<AnnouncementResponse> getAll(Pageable pageable);

    Page<AnnouncementResponse> getPublished(Pageable pageable);

    Page<AnnouncementResponse> search(AnnouncementCategory category, String keyword, Pageable pageable);

    List<AnnouncementResponse> getPinned();

    AnnouncementResponse update(UUID id, UpdateAnnouncementRequest request);

    void delete(UUID id);

    void publish(UUID id);

    void unpublish(UUID id);
}

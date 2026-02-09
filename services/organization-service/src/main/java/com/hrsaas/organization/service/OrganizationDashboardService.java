package com.hrsaas.organization.service;

import com.hrsaas.organization.domain.dto.response.AnnouncementResponse;
import com.hrsaas.organization.domain.dto.response.OrgSummaryResponse;
import com.hrsaas.organization.domain.entity.DepartmentStatus;
import com.hrsaas.organization.repository.DepartmentRepository;
import com.hrsaas.organization.repository.PositionRepository;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrganizationDashboardService {

    private final AnnouncementService announcementService;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;

    public Map<String, Object> getDashboardAnnouncements() {
        List<AnnouncementResponse> pinned = announcementService.getPinned();
        Page<AnnouncementResponse> published = announcementService.getPublished(PageRequest.of(0, 5));

        // pinned 우선 + 최신 published 합쳐서 반환 (중복 제거)
        List<AnnouncementResponse> combined = new ArrayList<>(pinned);
        published.getContent().stream()
            .filter(p -> combined.stream().noneMatch(c -> c.getId().equals(p.getId())))
            .forEach(combined::add);

        List<Map<String, Object>> announcements = combined.stream()
            .map(a -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", a.getId());
                item.put("title", a.getTitle());
                item.put("category", a.getCategory());
                item.put("isPinned", a.getIsPinned());
                item.put("createdAt", a.getCreatedAt());
                Map<String, String> author = new LinkedHashMap<>();
                author.put("name", a.getAuthorName());
                author.put("department", a.getAuthorDepartment());
                item.put("author", author);
                return item;
            })
            .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("announcements", announcements);
        result.put("totalCount", published.getTotalElements());
        return result;
    }

    public OrgSummaryResponse getOrgSummary() {
        UUID tenantId = TenantContext.getCurrentTenant();
        long departmentCount = departmentRepository
            .findAllByTenantAndStatus(tenantId, DepartmentStatus.ACTIVE).size();
        long positionCount = positionRepository.findActiveByTenantId(tenantId).size();

        return OrgSummaryResponse.builder()
            .departmentCount(departmentCount)
            .positionCount(positionCount)
            .build();
    }
}

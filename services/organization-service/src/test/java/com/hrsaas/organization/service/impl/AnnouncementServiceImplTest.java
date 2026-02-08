package com.hrsaas.organization.service.impl;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.TestEntityFactory;
import com.hrsaas.organization.domain.dto.request.CreateAnnouncementRequest;
import com.hrsaas.organization.domain.dto.response.AnnouncementResponse;
import com.hrsaas.organization.domain.entity.Announcement;
import com.hrsaas.organization.domain.entity.AnnouncementCategory;
import com.hrsaas.organization.domain.entity.AnnouncementRead;
import com.hrsaas.organization.domain.entity.AnnouncementTarget;
import com.hrsaas.organization.repository.AnnouncementReadRepository;
import com.hrsaas.organization.repository.AnnouncementRepository;
import com.hrsaas.organization.repository.AnnouncementTargetRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnnouncementServiceImplTest {

    @Mock
    private AnnouncementRepository announcementRepository;

    @Mock
    private AnnouncementTargetRepository announcementTargetRepository;

    @Mock
    private AnnouncementReadRepository announcementReadRepository;

    @InjectMocks
    private AnnouncementServiceImpl announcementService;

    private UUID tenantId;
    private UUID announcementId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        announcementId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clear();
    }

    // ===== create =====

    @Test
    @DisplayName("create: success without targeting - returns AnnouncementResponse")
    void create_success_returnsResponse() {
        // given
        CreateAnnouncementRequest request = CreateAnnouncementRequest.builder()
                .title("테스트 공지")
                .content("테스트 내용입니다.")
                .category(AnnouncementCategory.NOTICE)
                .isPinned(false)
                .isPublished(false)
                .build();

        when(announcementRepository.save(any(Announcement.class))).thenAnswer(invocation -> {
            Announcement saved = invocation.getArgument(0);
            TestEntityFactory.setEntityId(saved, announcementId);
            return saved;
        });

        // when
        AnnouncementResponse response = announcementService.create(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("테스트 공지");
        assertThat(response.getCategory()).isEqualTo(AnnouncementCategory.NOTICE);
        assertThat(response.getIsPublished()).isFalse();

        verify(announcementRepository).save(any(Announcement.class));
        verify(announcementTargetRepository, never()).save(any(AnnouncementTarget.class));
    }

    @Test
    @DisplayName("create: G05 targetScope=TARGETED with departmentIds - saves targets")
    void create_withTargets_savesTargets() {
        // given
        UUID deptId1 = UUID.randomUUID();
        UUID deptId2 = UUID.randomUUID();

        CreateAnnouncementRequest request = CreateAnnouncementRequest.builder()
                .title("부서 대상 공지")
                .content("특정 부서 대상 공지 내용")
                .category(AnnouncementCategory.NOTICE)
                .isPinned(false)
                .isPublished(true)
                .targetScope("TARGETED")
                .targetDepartmentIds(List.of(deptId1, deptId2))
                .build();

        when(announcementRepository.save(any(Announcement.class))).thenAnswer(invocation -> {
            Announcement saved = invocation.getArgument(0);
            TestEntityFactory.setEntityId(saved, announcementId);
            return saved;
        });
        when(announcementTargetRepository.save(any(AnnouncementTarget.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        AnnouncementResponse response = announcementService.create(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getIsPublished()).isTrue();

        ArgumentCaptor<AnnouncementTarget> targetCaptor = ArgumentCaptor.forClass(AnnouncementTarget.class);
        verify(announcementTargetRepository, times(2)).save(targetCaptor.capture());

        List<AnnouncementTarget> savedTargets = targetCaptor.getAllValues();
        assertThat(savedTargets).hasSize(2);
        assertThat(savedTargets).allSatisfy(target -> {
            assertThat(target.getAnnouncementId()).isEqualTo(announcementId);
            assertThat(target.getTargetType()).isEqualTo("DEPARTMENT");
        });
        assertThat(savedTargets.get(0).getTargetId()).isEqualTo(deptId1);
        assertThat(savedTargets.get(1).getTargetId()).isEqualTo(deptId2);
    }

    // ===== getById =====

    @Test
    @DisplayName("getById: exists - increments viewCount and returns response")
    void getById_exists_returnsResponse() {
        // given
        Announcement announcement = TestEntityFactory.createAnnouncement(
                announcementId, "공지 제목", "공지 내용");

        when(announcementRepository.findByIdAndTenantId(announcementId, tenantId))
                .thenReturn(Optional.of(announcement));
        doNothing().when(announcementRepository).incrementViewCount(announcementId);
        when(announcementReadRepository.countByAnnouncementId(announcementId)).thenReturn(5L);

        // when (no user context set - employeeId will be null)
        AnnouncementResponse response = announcementService.getById(announcementId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("공지 제목");
        assertThat(response.getViewCount()).isEqualTo(1L);
        assertThat(response.getReadCount()).isEqualTo(5L);
        assertThat(response.getIsRead()).isFalse();

        verify(announcementRepository).incrementViewCount(announcementId);
        // No read recorded because no user context
        verify(announcementReadRepository, never()).save(any(AnnouncementRead.class));
    }

    @Test
    @DisplayName("getById: not found - throws NotFoundException")
    void getById_notFound_throwsNotFoundException() {
        // given
        UUID nonExistentId = UUID.randomUUID();
        when(announcementRepository.findByIdAndTenantId(nonExistentId, tenantId))
                .thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> announcementService.getById(nonExistentId))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("getById: G12 records read when logged-in user views announcement")
    void getById_recordsRead_whenLoggedIn() {
        // given
        UUID userId = UUID.randomUUID();
        UserContext userContext = UserContext.builder()
                .userId(userId)
                .username("testuser")
                .tenantId(tenantId)
                .roles(Set.of("ROLE_USER"))
                .build();
        SecurityContextHolder.setContext(userContext);

        Announcement announcement = TestEntityFactory.createAnnouncement(
                announcementId, "읽기 추적 공지", "내용");

        when(announcementRepository.findByIdAndTenantId(announcementId, tenantId))
                .thenReturn(Optional.of(announcement));
        doNothing().when(announcementRepository).incrementViewCount(announcementId);
        // Called twice: first in recording check (line 98), then for isRead enrichment (line 109)
        when(announcementReadRepository.existsByAnnouncementIdAndEmployeeId(announcementId, userId))
                .thenReturn(false)  // first call: not yet read -> triggers save
                .thenReturn(true);  // second call: now marked as read
        when(announcementReadRepository.save(any(AnnouncementRead.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(announcementReadRepository.countByAnnouncementId(announcementId)).thenReturn(1L);

        // when
        AnnouncementResponse response = announcementService.getById(announcementId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getReadCount()).isEqualTo(1L);
        assertThat(response.getIsRead()).isTrue();

        ArgumentCaptor<AnnouncementRead> readCaptor = ArgumentCaptor.forClass(AnnouncementRead.class);
        verify(announcementReadRepository).save(readCaptor.capture());

        AnnouncementRead savedRead = readCaptor.getValue();
        assertThat(savedRead.getAnnouncementId()).isEqualTo(announcementId);
        assertThat(savedRead.getEmployeeId()).isEqualTo(userId);
    }

    // ===== getAll =====

    @Test
    @DisplayName("getAll: returns paginated results")
    void getAll_returnsPaginatedResults() {
        // given
        Pageable pageable = PageRequest.of(0, 10);
        Announcement a1 = TestEntityFactory.createAnnouncement(UUID.randomUUID(), "공지1", "내용1");
        Announcement a2 = TestEntityFactory.createAnnouncement(UUID.randomUUID(), "공지2", "내용2");
        Page<Announcement> page = new PageImpl<>(List.of(a1, a2), pageable, 2);

        when(announcementRepository.findAllByTenantId(tenantId, pageable)).thenReturn(page);

        // when
        Page<AnnouncementResponse> result = announcementService.getAll(pageable);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("공지1");
        assertThat(result.getContent().get(1).getTitle()).isEqualTo("공지2");

        verify(announcementRepository).findAllByTenantId(tenantId, pageable);
    }

    // ===== publish =====

    @Test
    @DisplayName("publish: success - updates announcement status to published")
    void publish_success_updatesStatus() {
        // given
        Announcement announcement = TestEntityFactory.createAnnouncement(
                announcementId, "미발행 공지", "내용");
        assertThat(announcement.getIsPublished()).isFalse();

        when(announcementRepository.findByIdAndTenantId(announcementId, tenantId))
                .thenReturn(Optional.of(announcement));
        when(announcementRepository.save(any(Announcement.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        announcementService.publish(announcementId);

        // then
        assertThat(announcement.getIsPublished()).isTrue();
        assertThat(announcement.getPublishedAt()).isNotNull();

        verify(announcementRepository).save(announcement);
    }

    // ===== delete =====

    @Test
    @DisplayName("delete: success - deletes the announcement")
    void delete_success_deletesAnnouncement() {
        // given
        Announcement announcement = TestEntityFactory.createAnnouncement(
                announcementId, "삭제 대상 공지", "내용");

        when(announcementRepository.findByIdAndTenantId(announcementId, tenantId))
                .thenReturn(Optional.of(announcement));
        doNothing().when(announcementRepository).delete(announcement);

        // when
        announcementService.delete(announcementId);

        // then
        verify(announcementRepository).delete(announcement);
    }
}

package com.hrsaas.recruitment.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.recruitment.domain.dto.request.CreateApplicantRequest;
import com.hrsaas.recruitment.domain.dto.response.ApplicantResponse;
import com.hrsaas.recruitment.domain.entity.Applicant;
import com.hrsaas.recruitment.repository.ApplicantRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicantServiceImplTest {

    @Mock
    private ApplicantRepository applicantRepository;

    @InjectMocks
    private ApplicantServiceImpl applicantService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ===== create =====

    @Test
    @DisplayName("create: validRequest - success")
    void create_validRequest_success() {
        // given
        CreateApplicantRequest request = CreateApplicantRequest.builder()
                .name("John Doe")
                .email("john.doe@example.com")
                .phone("010-1234-5678")
                .birthDate(LocalDate.of(1990, 1, 1))
                .gender("Male")
                .address("Seoul, Korea")
                .resumeFileId(UUID.randomUUID())
                .portfolioUrl("https://portfolio.example.com")
                .linkedinUrl("https://linkedin.com/in/johndoe")
                .githubUrl("https://github.com/johndoe")
                .skills(List.of("Java", "Spring"))
                .source("LinkedIn")
                .sourceDetail("Applied via LinkedIn")
                .notes("Strong candidate")
                .build();

        Applicant savedApplicant = createApplicant(request);
        UUID applicantId = UUID.randomUUID();
        setEntityId(savedApplicant, applicantId);

        when(applicantRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(applicantRepository.save(any(Applicant.class))).thenReturn(savedApplicant);

        // when
        ApplicantResponse response = applicantService.create(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(applicantId);
        assertThat(response.getName()).isEqualTo(request.getName());
        assertThat(response.getEmail()).isEqualTo(request.getEmail());
        assertThat(response.getPhone()).isEqualTo(request.getPhone());
        assertThat(response.getSkills()).contains("Java", "Spring");

        verify(applicantRepository).existsByEmail(request.getEmail());
        verify(applicantRepository).save(any(Applicant.class));
    }

    @Test
    @DisplayName("create: duplicateEmail - throwsException")
    void create_duplicateEmail_throwsException() {
        // given
        CreateApplicantRequest request = CreateApplicantRequest.builder()
                .name("Jane Doe")
                .email("jane.doe@example.com")
                .build();

        when(applicantRepository.existsByEmail(request.getEmail())).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> applicantService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("이미 등록된 이메일입니다");

        verify(applicantRepository).existsByEmail(request.getEmail());
        verify(applicantRepository, never()).save(any(Applicant.class));
    }

    // ===== getById =====

    @Test
    @DisplayName("getById: exists - returnsResponse")
    void getById_exists_returnsResponse() {
        // given
        UUID id = UUID.randomUUID();
        Applicant applicant = createDefaultApplicant();
        setEntityId(applicant, id);

        when(applicantRepository.findById(id)).thenReturn(Optional.of(applicant));

        // when
        ApplicantResponse response = applicantService.getById(id);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(id);
        assertThat(response.getName()).isEqualTo("Default Applicant");
        verify(applicantRepository).findById(id);
    }

    @Test
    @DisplayName("getById: notFound - throwsException")
    void getById_notFound_throwsException() {
        // given
        UUID id = UUID.randomUUID();
        when(applicantRepository.findById(id)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> applicantService.getById(id))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("지원자를 찾을 수 없습니다");

        verify(applicantRepository).findById(id);
    }

    // ===== getByEmail =====

    @Test
    @DisplayName("getByEmail: exists - returnsResponse")
    void getByEmail_exists_returnsResponse() {
        // given
        String email = "test@example.com";
        Applicant applicant = createDefaultApplicant();
        setEntityId(applicant, UUID.randomUUID());
        // Override email for this test
        try {
            var field = Applicant.class.getDeclaredField("email");
            field.setAccessible(true);
            field.set(applicant, email);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        when(applicantRepository.findByEmail(email)).thenReturn(Optional.of(applicant));

        // when
        ApplicantResponse response = applicantService.getByEmail(email);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo(email);
        verify(applicantRepository).findByEmail(email);
    }

    @Test
    @DisplayName("getByEmail: notFound - throwsException")
    void getByEmail_notFound_throwsException() {
        // given
        String email = "unknown@example.com";
        when(applicantRepository.findByEmail(email)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> applicantService.getByEmail(email))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("지원자를 찾을 수 없습니다");

        verify(applicantRepository).findByEmail(email);
    }

    // ===== getAll =====

    @Test
    @DisplayName("getAll: returnsPage")
    void getAll_returnsPage() {
        // given
        Pageable pageable = PageRequest.of(0, 10);
        Applicant applicant = createDefaultApplicant();
        setEntityId(applicant, UUID.randomUUID());
        Page<Applicant> page = new PageImpl<>(List.of(applicant));

        when(applicantRepository.findAll(pageable)).thenReturn(page);

        // when
        Page<ApplicantResponse> result = applicantService.getAll(pageable);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Default Applicant");
        verify(applicantRepository).findAll(pageable);
    }

    // ===== search =====

    @Test
    @DisplayName("search: returnsPage")
    void search_returnsPage() {
        // given
        String keyword = "test";
        Pageable pageable = PageRequest.of(0, 10);
        Applicant applicant = createDefaultApplicant();
        setEntityId(applicant, UUID.randomUUID());
        Page<Applicant> page = new PageImpl<>(List.of(applicant));

        when(applicantRepository.searchByKeyword(keyword, pageable)).thenReturn(page);

        // when
        Page<ApplicantResponse> result = applicantService.search(keyword, pageable);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        verify(applicantRepository).searchByKeyword(keyword, pageable);
    }

    // ===== getBlacklisted =====

    @Test
    @DisplayName("getBlacklisted: returnsPage")
    void getBlacklisted_returnsPage() {
        // given
        Pageable pageable = PageRequest.of(0, 10);
        Applicant applicant = createDefaultApplicant();
        setEntityId(applicant, UUID.randomUUID());
        applicant.blacklist("Reason");
        Page<Applicant> page = new PageImpl<>(List.of(applicant));

        when(applicantRepository.findByBlacklistedTrueOrderByCreatedAtDesc(pageable)).thenReturn(page);

        // when
        Page<ApplicantResponse> result = applicantService.getBlacklisted(pageable);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).isBlacklisted()).isTrue();
        verify(applicantRepository).findByBlacklistedTrueOrderByCreatedAtDesc(pageable);
    }

    // ===== update =====

    @Test
    @DisplayName("update: exists - success")
    void update_exists_success() {
        // given
        UUID id = UUID.randomUUID();
        Applicant applicant = createDefaultApplicant();
        setEntityId(applicant, id);

        CreateApplicantRequest updateRequest = CreateApplicantRequest.builder()
                .name("Updated Name")
                .phone("010-9999-8888")
                .notes("Updated notes")
                .build();

        when(applicantRepository.findById(id)).thenReturn(Optional.of(applicant));
        when(applicantRepository.save(any(Applicant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        ApplicantResponse response = applicantService.update(id, updateRequest);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(id);
        assertThat(response.getName()).isEqualTo("Updated Name");
        assertThat(response.getPhone()).isEqualTo("010-9999-8888");
        assertThat(response.getNotes()).isEqualTo("Updated notes");

        verify(applicantRepository).findById(id);
        verify(applicantRepository).save(any(Applicant.class));
    }

    @Test
    @DisplayName("update: notFound - throwsException")
    void update_notFound_throwsException() {
        // given
        UUID id = UUID.randomUUID();
        CreateApplicantRequest updateRequest = CreateApplicantRequest.builder().name("Updated").build();

        when(applicantRepository.findById(id)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> applicantService.update(id, updateRequest))
                .isInstanceOf(BusinessException.class);

        verify(applicantRepository).findById(id);
        verify(applicantRepository, never()).save(any(Applicant.class));
    }

    // ===== delete =====

    @Test
    @DisplayName("delete: exists - success")
    void delete_exists_success() {
        // given
        UUID id = UUID.randomUUID();
        when(applicantRepository.existsById(id)).thenReturn(true);
        doNothing().when(applicantRepository).deleteById(id);

        // when
        applicantService.delete(id);

        // then
        verify(applicantRepository).existsById(id);
        verify(applicantRepository).deleteById(id);
    }

    @Test
    @DisplayName("delete: notFound - throwsException")
    void delete_notFound_throwsException() {
        // given
        UUID id = UUID.randomUUID();
        when(applicantRepository.existsById(id)).thenReturn(false);

        // when & then
        assertThatThrownBy(() -> applicantService.delete(id))
                .isInstanceOf(BusinessException.class);

        verify(applicantRepository).existsById(id);
        verify(applicantRepository, never()).deleteById(any());
    }

    // ===== blacklist =====

    @Test
    @DisplayName("blacklist: exists - success")
    void blacklist_exists_success() {
        // given
        UUID id = UUID.randomUUID();
        String reason = "Bad behavior";
        Applicant applicant = createDefaultApplicant();
        setEntityId(applicant, id);

        when(applicantRepository.findById(id)).thenReturn(Optional.of(applicant));
        when(applicantRepository.save(any(Applicant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        applicantService.blacklist(id, reason);

        // then
        assertThat(applicant.isBlacklisted()).isTrue();
        assertThat(applicant.getBlacklistReason()).isEqualTo(reason);
        verify(applicantRepository).findById(id);
        verify(applicantRepository).save(applicant);
    }

    @Test
    @DisplayName("blacklist: notFound - throwsException")
    void blacklist_notFound_throwsException() {
        // given
        UUID id = UUID.randomUUID();
        when(applicantRepository.findById(id)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> applicantService.blacklist(id, "reason"))
                .isInstanceOf(BusinessException.class);

        verify(applicantRepository).findById(id);
        verify(applicantRepository, never()).save(any());
    }

    // ===== unblacklist =====

    @Test
    @DisplayName("unblacklist: exists - success")
    void unblacklist_exists_success() {
        // given
        UUID id = UUID.randomUUID();
        Applicant applicant = createDefaultApplicant();
        setEntityId(applicant, id);
        applicant.blacklist("reason"); // blacklist first

        when(applicantRepository.findById(id)).thenReturn(Optional.of(applicant));
        when(applicantRepository.save(any(Applicant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        applicantService.unblacklist(id);

        // then
        assertThat(applicant.isBlacklisted()).isFalse();
        assertThat(applicant.getBlacklistReason()).isNull();
        verify(applicantRepository).findById(id);
        verify(applicantRepository).save(applicant);
    }

    @Test
    @DisplayName("unblacklist: notFound - throwsException")
    void unblacklist_notFound_throwsException() {
        // given
        UUID id = UUID.randomUUID();
        when(applicantRepository.findById(id)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> applicantService.unblacklist(id))
                .isInstanceOf(BusinessException.class);

        verify(applicantRepository).findById(id);
        verify(applicantRepository, never()).save(any());
    }

    // ===== Helper methods =====

    private Applicant createDefaultApplicant() {
        return Applicant.builder()
                .name("Default Applicant")
                .email("default@example.com")
                .phone("010-0000-0000")
                .build();
    }

    private Applicant createApplicant(CreateApplicantRequest request) {
        return Applicant.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .birthDate(request.getBirthDate())
                .gender(request.getGender())
                .address(request.getAddress())
                .resumeFileId(request.getResumeFileId())
                .portfolioUrl(request.getPortfolioUrl())
                .linkedinUrl(request.getLinkedinUrl())
                .githubUrl(request.getGithubUrl())
                .education(request.getEducation())
                .experience(request.getExperience())
                .skills(request.getSkills())
                .certificates(request.getCertificates())
                .languages(request.getLanguages())
                .source(request.getSource())
                .sourceDetail(request.getSourceDetail())
                .notes(request.getNotes())
                .build();
    }

    private void setEntityId(Object entity, UUID id) {
        try {
            var field = findField(entity.getClass(), "id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set entity ID", e);
        }
    }

    private java.lang.reflect.Field findField(Class<?> clazz, String name) {
        while (clazz != null) {
            try {
                return clazz.getDeclaredField(name);
            } catch (NoSuchFieldException e) {
                clazz = clazz.getSuperclass();
            }
        }
        throw new RuntimeException("Field not found: " + name);
    }
}

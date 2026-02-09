package com.hrsaas.organization.service.impl;

import com.hrsaas.common.cache.CacheNames;
import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.domain.dto.request.AddCommitteeMemberRequest;
import com.hrsaas.organization.domain.dto.request.CreateCommitteeRequest;
import com.hrsaas.organization.domain.dto.request.UpdateCommitteeRequest;
import com.hrsaas.organization.domain.dto.response.CommitteeResponse;
import com.hrsaas.organization.domain.entity.Committee;
import com.hrsaas.organization.domain.entity.CommitteeMember;
import com.hrsaas.organization.domain.entity.CommitteeStatus;
import com.hrsaas.organization.domain.entity.CommitteeType;
import com.hrsaas.organization.repository.CommitteeMemberRepository;
import com.hrsaas.organization.repository.CommitteeRepository;
import com.hrsaas.organization.service.CommitteeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommitteeServiceImpl implements CommitteeService {

    private final CommitteeRepository committeeRepository;
    private final CommitteeMemberRepository committeeMemberRepository;

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.COMMITTEE, allEntries = true)
    public CommitteeResponse create(CreateCommitteeRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();

        if (committeeRepository.existsByCodeAndTenantId(request.getCode(), tenantId)) {
            throw new DuplicateException("ORG_005", "이미 존재하는 위원회 코드입니다: " + request.getCode());
        }

        Committee committee = Committee.builder()
            .code(request.getCode())
            .name(request.getName())
            .nameEn(request.getNameEn())
            .type(request.getType())
            .purpose(request.getPurpose())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .meetingSchedule(request.getMeetingSchedule())
            .build();

        Committee saved = committeeRepository.save(committee);

        log.info("Committee created: id={}, code={}", saved.getId(), saved.getCode());

        return CommitteeResponse.from(saved);
    }

    @Override
    @Cacheable(value = CacheNames.COMMITTEE,
               key = "T(com.hrsaas.common.tenant.TenantContext).getCurrentTenant() + ':' + #id")
    public CommitteeResponse getById(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Committee committee = findByIdAndTenantId(id, tenantId);
        return CommitteeResponse.fromWithMembers(committee);
    }

    @Override
    @Cacheable(value = CacheNames.COMMITTEE,
               key = "'all:' + T(com.hrsaas.common.tenant.TenantContext).getCurrentTenant()",
               unless = "#result == null || #result.isEmpty()")
    public List<CommitteeResponse> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<Committee> committees = committeeRepository.findAllByTenantId(tenantId);
        return committees.stream()
            .map(CommitteeResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = CacheNames.COMMITTEE,
               key = "'status:' + #status + ':' + T(com.hrsaas.common.tenant.TenantContext).getCurrentTenant()",
               unless = "#result == null || #result.isEmpty()")
    public List<CommitteeResponse> getByStatus(CommitteeStatus status) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<Committee> committees = committeeRepository.findByTenantIdAndStatus(tenantId, status);
        return committees.stream()
            .map(CommitteeResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = CacheNames.COMMITTEE,
               key = "'type:' + #type + ':' + T(com.hrsaas.common.tenant.TenantContext).getCurrentTenant()",
               unless = "#result == null || #result.isEmpty()")
    public List<CommitteeResponse> getByType(CommitteeType type) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<Committee> committees = committeeRepository.findByTenantIdAndType(tenantId, type);
        return committees.stream()
            .map(CommitteeResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.COMMITTEE, allEntries = true)
    public CommitteeResponse update(UUID id, UpdateCommitteeRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Committee committee = findByIdAndTenantId(id, tenantId);

        committee.update(
            request.getName(),
            request.getNameEn(),
            request.getType(),
            request.getPurpose(),
            request.getStartDate(),
            request.getEndDate(),
            request.getMeetingSchedule()
        );

        if (request.getStatus() != null) {
            switch (request.getStatus()) {
                case ACTIVE -> committee.activate();
                case INACTIVE -> committee.deactivate();
                case DISSOLVED -> committee.dissolve();
            }
        }

        Committee saved = committeeRepository.save(committee);

        log.info("Committee updated: id={}", id);

        return CommitteeResponse.fromWithMembers(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.COMMITTEE, allEntries = true)
    public void delete(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Committee committee = findByIdAndTenantId(id, tenantId);
        committeeRepository.delete(committee);
        log.info("Committee deleted: id={}", id);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.COMMITTEE, allEntries = true)
    public void dissolve(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Committee committee = findByIdAndTenantId(id, tenantId);
        committee.dissolve();
        committeeRepository.save(committee);
        log.info("Committee dissolved: id={}", id);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.COMMITTEE, allEntries = true)
    public CommitteeResponse.MemberResponse addMember(UUID committeeId, AddCommitteeMemberRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Committee committee = findByIdAndTenantId(committeeId, tenantId);

        if (committeeMemberRepository.existsByCommitteeIdAndEmployeeIdAndIsActiveTrue(
                committeeId, request.getEmployeeId())) {
            throw new DuplicateException("ORG_006", "이미 위원회에 등록된 직원입니다.");
        }

        CommitteeMember member = CommitteeMember.builder()
            .committee(committee)
            .employeeId(request.getEmployeeId())
            .employeeName(request.getEmployeeName())
            .departmentName(request.getDepartmentName())
            .positionName(request.getPositionName())
            .role(request.getRole())
            .joinDate(request.getJoinDate())
            .build();

        committee.addMember(member);
        committeeRepository.save(committee);

        log.info("Committee member added: committeeId={}, employeeId={}", committeeId, request.getEmployeeId());

        return CommitteeResponse.MemberResponse.from(member);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.COMMITTEE, allEntries = true)
    public void removeMember(UUID committeeId, UUID memberId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        findByIdAndTenantId(committeeId, tenantId);

        CommitteeMember member = committeeMemberRepository.findById(memberId)
            .orElseThrow(() -> new NotFoundException("ORG_007", "위원회 멤버를 찾을 수 없습니다: " + memberId));

        member.leave();
        committeeMemberRepository.save(member);

        log.info("Committee member removed: committeeId={}, memberId={}", committeeId, memberId);
    }

    @Override
    public List<CommitteeResponse.MemberResponse> getMembers(UUID committeeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        findByIdAndTenantId(committeeId, tenantId);

        List<CommitteeMember> members = committeeMemberRepository.findActiveByCommitteeId(committeeId);
        return members.stream()
            .map(CommitteeResponse.MemberResponse::from)
            .collect(Collectors.toList());
    }

    private Committee findByIdAndTenantId(UUID id, UUID tenantId) {
        return committeeRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new NotFoundException("ORG_005", "위원회를 찾을 수 없습니다: " + id));
    }
}

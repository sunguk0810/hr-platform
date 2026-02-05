package com.hrsaas.organization.service;

import com.hrsaas.organization.domain.dto.request.AddCommitteeMemberRequest;
import com.hrsaas.organization.domain.dto.request.CreateCommitteeRequest;
import com.hrsaas.organization.domain.dto.request.UpdateCommitteeRequest;
import com.hrsaas.organization.domain.dto.response.CommitteeResponse;
import com.hrsaas.organization.domain.entity.CommitteeStatus;
import com.hrsaas.organization.domain.entity.CommitteeType;

import java.util.List;
import java.util.UUID;

public interface CommitteeService {

    CommitteeResponse create(CreateCommitteeRequest request);

    CommitteeResponse getById(UUID id);

    List<CommitteeResponse> getAll();

    List<CommitteeResponse> getByStatus(CommitteeStatus status);

    List<CommitteeResponse> getByType(CommitteeType type);

    CommitteeResponse update(UUID id, UpdateCommitteeRequest request);

    void delete(UUID id);

    void dissolve(UUID id);

    CommitteeResponse.MemberResponse addMember(UUID committeeId, AddCommitteeMemberRequest request);

    void removeMember(UUID committeeId, UUID memberId);

    List<CommitteeResponse.MemberResponse> getMembers(UUID committeeId);
}

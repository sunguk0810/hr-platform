package com.hrsaas.employee.service;

import com.hrsaas.employee.domain.dto.request.CreateCardIssueRequest;
import com.hrsaas.employee.domain.dto.request.ReportLostRequest;
import com.hrsaas.employee.domain.dto.request.RevokeCardRequest;
import com.hrsaas.employee.domain.dto.response.CardIssueRequestResponse;
import com.hrsaas.employee.domain.dto.response.EmployeeCardResponse;
import com.hrsaas.employee.domain.entity.CardStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface EmployeeCardService {

    Page<EmployeeCardResponse> getCards(Pageable pageable, CardStatus status);

    EmployeeCardResponse getMyCard();

    EmployeeCardResponse getById(UUID id);

    Page<CardIssueRequestResponse> getIssueRequests(Pageable pageable);

    CardIssueRequestResponse createIssueRequest(CreateCardIssueRequest request);

    CardIssueRequestResponse approveIssueRequest(UUID requestId);

    EmployeeCardResponse reportLost(ReportLostRequest request);

    EmployeeCardResponse revokeCard(UUID cardId, RevokeCardRequest request);

    void autoIssueForNewEmployee(UUID employeeId);
}

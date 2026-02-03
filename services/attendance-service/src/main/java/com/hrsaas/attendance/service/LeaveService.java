package com.hrsaas.attendance.service;

import com.hrsaas.attendance.domain.dto.request.CreateLeaveRequest;
import com.hrsaas.attendance.domain.dto.response.LeaveBalanceResponse;
import com.hrsaas.attendance.domain.dto.response.LeaveRequestResponse;
import com.hrsaas.common.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface LeaveService {

    LeaveRequestResponse create(CreateLeaveRequest request, UUID employeeId, String employeeName,
                                 UUID departmentId, String departmentName);

    LeaveRequestResponse getById(UUID id);

    PageResponse<LeaveRequestResponse> getMyLeaves(UUID employeeId, Pageable pageable);

    LeaveRequestResponse submit(UUID leaveId, UUID employeeId);

    LeaveRequestResponse cancel(UUID leaveId, UUID employeeId);

    List<LeaveBalanceResponse> getMyBalances(UUID employeeId, Integer year);

    void handleApprovalCompleted(UUID leaveId, boolean approved);
}

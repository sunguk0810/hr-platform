package com.hrsaas.attendance.service;

import com.hrsaas.attendance.domain.dto.request.CreateLeaveRequest;
import com.hrsaas.attendance.domain.dto.response.*;
import com.hrsaas.attendance.domain.entity.LeaveType;
import com.hrsaas.common.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface LeaveService {

    LeaveRequestResponse create(CreateLeaveRequest request, UUID employeeId, String employeeName,
                                 UUID departmentId, String departmentName);

    LeaveRequestResponse getById(UUID id, UUID userId, Collection<String> roles);

    PageResponse<LeaveRequestResponse> getMyLeaves(UUID employeeId, Pageable pageable);

    LeaveRequestResponse submit(UUID leaveId, UUID employeeId);

    LeaveRequestResponse cancel(UUID leaveId, UUID employeeId);

    List<LeaveBalanceResponse> getMyBalances(UUID employeeId, Integer year);

    void handleApprovalCompleted(UUID leaveId, boolean approved);

    // Admin APIs
    PageResponse<PendingLeaveResponse> getPendingLeaves(UUID departmentId, LeaveType leaveType, Pageable pageable);

    PendingLeaveSummaryResponse getPendingSummary();

    LeaveRequestResponse adminApprove(UUID leaveId, String comment, UUID adminId);

    LeaveRequestResponse adminReject(UUID leaveId, String reason, UUID adminId);

    BulkOperationResponse bulkApprove(List<UUID> ids, String comment, UUID adminId);

    BulkOperationResponse bulkReject(List<UUID> ids, String reason, UUID adminId);

    List<LeaveBalanceResponse> getBalanceByType(UUID employeeId, Integer year);

    // Calendar API
    List<LeaveCalendarEventResponse> getCalendarEvents(LocalDate startDate, LocalDate endDate, UUID departmentId);
}

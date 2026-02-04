package com.hrsaas.appointment.domain.dto.response;

import com.hrsaas.appointment.domain.entity.AppointmentDraft;
import com.hrsaas.appointment.domain.entity.DraftStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDraftResponse {

    private UUID id;
    private String draftNumber;
    private String title;
    private LocalDate effectiveDate;
    private String description;
    private DraftStatus status;
    private UUID approvalId;
    private int detailCount;
    private List<AppointmentDetailResponse> details;
    private Instant approvedAt;
    private Instant executedAt;
    private Instant cancelledAt;
    private String cancelReason;
    private Instant createdAt;
    private Instant updatedAt;

    public static AppointmentDraftResponse from(AppointmentDraft draft) {
        return AppointmentDraftResponse.builder()
            .id(draft.getId())
            .draftNumber(draft.getDraftNumber())
            .title(draft.getTitle())
            .effectiveDate(draft.getEffectiveDate())
            .description(draft.getDescription())
            .status(draft.getStatus())
            .approvalId(draft.getApprovalId())
            .detailCount(draft.getDetails() != null ? draft.getDetails().size() : 0)
            .approvedAt(draft.getApprovedAt())
            .executedAt(draft.getExecutedAt())
            .cancelledAt(draft.getCancelledAt())
            .cancelReason(draft.getCancelReason())
            .createdAt(draft.getCreatedAt())
            .updatedAt(draft.getUpdatedAt())
            .build();
    }

    public static AppointmentDraftResponse fromWithDetails(AppointmentDraft draft) {
        AppointmentDraftResponse response = from(draft);
        if (draft.getDetails() != null) {
            response.setDetails(draft.getDetails().stream()
                .map(AppointmentDetailResponse::from)
                .toList());
        }
        return response;
    }
}

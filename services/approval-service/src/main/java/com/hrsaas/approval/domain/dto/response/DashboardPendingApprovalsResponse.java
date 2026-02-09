package com.hrsaas.approval.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardPendingApprovalsResponse {

    private long total;
    private List<PendingApprovalItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PendingApprovalItem {
        private UUID id;
        private String type;
        private String title;
        private String requester;
        private Instant requestDate;
        private String urgency;

        public static PendingApprovalItem from(ApprovalDocumentResponse doc) {
            return PendingApprovalItem.builder()
                .id(doc.getId())
                .type(doc.getDocumentType())
                .title(doc.getTitle())
                .requester(doc.getDrafterName())
                .requestDate(doc.getSubmittedAt())
                .urgency(determineUrgency(doc.getSubmittedAt()))
                .build();
        }

        private static String determineUrgency(Instant submittedAt) {
            if (submittedAt == null) return "NORMAL";
            long hoursSinceSubmitted = java.time.Duration.between(submittedAt, Instant.now()).toHours();
            if (hoursSinceSubmitted > 72) return "HIGH";
            if (hoursSinceSubmitted > 24) return "MEDIUM";
            return "NORMAL";
        }
    }
}

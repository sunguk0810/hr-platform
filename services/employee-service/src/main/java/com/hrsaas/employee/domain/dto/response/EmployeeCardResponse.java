package com.hrsaas.employee.domain.dto.response;

import com.hrsaas.employee.domain.entity.CardIssueType;
import com.hrsaas.employee.domain.entity.CardStatus;
import com.hrsaas.employee.domain.entity.EmployeeCard;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeCardResponse {

    private UUID id;
    private String cardNumber;
    private UUID employeeId;
    private CardStatus status;
    private CardIssueType issueType;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String accessLevel;
    private Boolean rfidEnabled;
    private UUID photoFileId;
    private String remarks;
    private Instant revokedAt;
    private String revokeReason;
    private Instant lostAt;
    private String lostLocation;
    private Instant createdAt;

    public static EmployeeCardResponse from(EmployeeCard card) {
        return EmployeeCardResponse.builder()
            .id(card.getId())
            .cardNumber(card.getCardNumber())
            .employeeId(card.getEmployeeId())
            .status(card.getStatus())
            .issueType(card.getIssueType())
            .issueDate(card.getIssueDate())
            .expiryDate(card.getExpiryDate())
            .accessLevel(card.getAccessLevel())
            .rfidEnabled(card.getRfidEnabled())
            .photoFileId(card.getPhotoFileId())
            .remarks(card.getRemarks())
            .revokedAt(card.getRevokedAt())
            .revokeReason(card.getRevokeReason())
            .lostAt(card.getLostAt())
            .lostLocation(card.getLostLocation())
            .createdAt(card.getCreatedAt())
            .build();
    }
}

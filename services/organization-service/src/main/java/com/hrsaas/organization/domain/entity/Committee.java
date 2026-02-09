package com.hrsaas.organization.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * 위원회 엔티티
 */
@Entity
@Table(name = "committee", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Committee extends TenantAwareEntity {

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "name_en", length = 200)
    private String nameEn;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private CommitteeType type = CommitteeType.PERMANENT;

    @Column(name = "purpose", columnDefinition = "TEXT")
    private String purpose;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "meeting_schedule", length = 500)
    private String meetingSchedule;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CommitteeStatus status = CommitteeStatus.ACTIVE;

    @OneToMany(mappedBy = "committee", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("role ASC, joinDate ASC")
    @BatchSize(size = 25)  // Fetch up to 25 member collections in one query
    private List<CommitteeMember> members = new ArrayList<>();

    @Builder
    public Committee(String code, String name, String nameEn, CommitteeType type,
                     String purpose, LocalDate startDate, LocalDate endDate,
                     String meetingSchedule) {
        this.code = code;
        this.name = name;
        this.nameEn = nameEn;
        this.type = type != null ? type : CommitteeType.PERMANENT;
        this.purpose = purpose;
        this.startDate = startDate;
        this.endDate = endDate;
        this.meetingSchedule = meetingSchedule;
        this.status = CommitteeStatus.ACTIVE;
    }

    public void update(String name, String nameEn, CommitteeType type,
                       String purpose, LocalDate startDate, LocalDate endDate,
                       String meetingSchedule) {
        if (name != null) {
            this.name = name;
        }
        if (nameEn != null) {
            this.nameEn = nameEn;
        }
        if (type != null) {
            this.type = type;
        }
        if (purpose != null) {
            this.purpose = purpose;
        }
        if (startDate != null) {
            this.startDate = startDate;
        }
        if (endDate != null) {
            this.endDate = endDate;
        }
        if (meetingSchedule != null) {
            this.meetingSchedule = meetingSchedule;
        }
    }

    public void activate() {
        this.status = CommitteeStatus.ACTIVE;
    }

    public void deactivate() {
        this.status = CommitteeStatus.INACTIVE;
    }

    public void dissolve() {
        this.status = CommitteeStatus.DISSOLVED;
    }

    public boolean isActive() {
        return this.status == CommitteeStatus.ACTIVE;
    }

    public void addMember(CommitteeMember member) {
        members.add(member);
        member.setCommittee(this);
    }

    public void removeMember(CommitteeMember member) {
        members.remove(member);
        member.setCommittee(null);
    }
}

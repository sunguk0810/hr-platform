package com.hrsaas.organization;

import com.hrsaas.common.entity.BaseEntity;
import com.hrsaas.organization.domain.entity.*;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Test utility for creating entity instances with IDs.
 */
public final class TestEntityFactory {

    private TestEntityFactory() {}

    public static void setEntityId(Object entity, UUID id) {
        try {
            Field idField = BaseEntity.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set entity ID", e);
        }
    }

    public static Department createDepartment(UUID id, String code, String name) {
        Department dept = Department.builder()
            .code(code)
            .name(name)
            .build();
        setEntityId(dept, id);
        return dept;
    }

    public static Department createDepartment(UUID id, String code, String name, Department parent) {
        Department dept = Department.builder()
            .code(code)
            .name(name)
            .parent(parent)
            .build();
        setEntityId(dept, id);
        return dept;
    }

    public static Grade createGrade(UUID id, String code, String name, int level) {
        Grade grade = Grade.builder()
            .code(code)
            .name(name)
            .level(level)
            .sortOrder(level)
            .build();
        setEntityId(grade, id);
        return grade;
    }

    public static Position createPosition(UUID id, String code, String name, int level) {
        Position position = Position.builder()
            .code(code)
            .name(name)
            .level(level)
            .sortOrder(level)
            .build();
        setEntityId(position, id);
        return position;
    }

    public static Announcement createAnnouncement(UUID id, String title, String content) {
        Announcement announcement = Announcement.builder()
            .title(title)
            .content(content)
            .authorId(UUID.randomUUID())
            .authorName("테스터")
            .build();
        setEntityId(announcement, id);
        return announcement;
    }

    public static Committee createCommittee(UUID id, String code, String name) {
        Committee committee = Committee.builder()
            .code(code)
            .name(name)
            .type(CommitteeType.PERMANENT)
            .purpose("테스트 위원회")
            .build();
        setEntityId(committee, id);
        return committee;
    }

    public static HeadcountPlan createHeadcountPlan(UUID id, int year, UUID departmentId, String departmentName) {
        HeadcountPlan plan = HeadcountPlan.builder()
            .year(year)
            .departmentId(departmentId)
            .departmentName(departmentName)
            .plannedCount(10)
            .currentCount(8)
            .build();
        setEntityId(plan, id);
        return plan;
    }

    public static HeadcountRequest createHeadcountRequest(UUID id, UUID departmentId, String departmentName) {
        HeadcountRequest request = HeadcountRequest.builder()
            .departmentId(departmentId)
            .departmentName(departmentName)
            .type(HeadcountRequestType.INCREASE)
            .requestCount(2)
            .reason("업무 증가")
            .effectiveDate(LocalDate.now().plusMonths(1))
            .requesterId(UUID.randomUUID())
            .requesterName("요청자")
            .build();
        setEntityId(request, id);
        return request;
    }
}

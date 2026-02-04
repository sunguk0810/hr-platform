package com.hrsaas.employee.service.impl;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeFamilyRequest;
import com.hrsaas.employee.domain.dto.request.UpdateEmployeeFamilyRequest;
import com.hrsaas.employee.domain.dto.response.EmployeeFamilyResponse;
import com.hrsaas.employee.domain.entity.EmployeeFamily;
import com.hrsaas.employee.repository.EmployeeFamilyRepository;
import com.hrsaas.employee.repository.EmployeeRepository;
import com.hrsaas.employee.service.EmployeeFamilyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeFamilyServiceImpl implements EmployeeFamilyService {

    private final EmployeeFamilyRepository employeeFamilyRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional
    public EmployeeFamilyResponse create(UUID employeeId, CreateEmployeeFamilyRequest request) {
        validateEmployeeExists(employeeId);

        EmployeeFamily family = EmployeeFamily.builder()
            .employeeId(employeeId)
            .relation(request.getRelation())
            .name(request.getName())
            .birthDate(request.getBirthDate())
            .occupation(request.getOccupation())
            .phone(request.getPhone())
            .isCohabiting(request.getIsCohabiting())
            .isDependent(request.getIsDependent())
            .remarks(request.getRemarks())
            .build();

        EmployeeFamily saved = employeeFamilyRepository.save(family);
        log.info("Employee family created: employeeId={}, relation={}", employeeId, request.getRelation());

        return EmployeeFamilyResponse.from(saved);
    }

    @Override
    public List<EmployeeFamilyResponse> getByEmployeeId(UUID employeeId) {
        validateEmployeeExists(employeeId);
        List<EmployeeFamily> families = employeeFamilyRepository.findByEmployeeId(employeeId);

        return families.stream()
            .map(EmployeeFamilyResponse::from)
            .toList();
    }

    @Override
    public List<EmployeeFamilyResponse> getDependents(UUID employeeId) {
        validateEmployeeExists(employeeId);
        List<EmployeeFamily> dependents = employeeFamilyRepository.findDependentsByEmployeeId(employeeId);

        return dependents.stream()
            .map(EmployeeFamilyResponse::from)
            .toList();
    }

    @Override
    @Transactional
    public EmployeeFamilyResponse update(UUID employeeId, UUID familyId, UpdateEmployeeFamilyRequest request) {
        EmployeeFamily family = findByIdAndEmployeeId(familyId, employeeId);

        family.update(
            request.getName(),
            request.getBirthDate(),
            request.getOccupation(),
            request.getPhone(),
            request.getIsCohabiting(),
            request.getIsDependent(),
            request.getRemarks()
        );

        EmployeeFamily saved = employeeFamilyRepository.save(family);
        log.info("Employee family updated: familyId={}", familyId);

        return EmployeeFamilyResponse.from(saved);
    }

    @Override
    @Transactional
    public void delete(UUID employeeId, UUID familyId) {
        EmployeeFamily family = findByIdAndEmployeeId(familyId, employeeId);
        employeeFamilyRepository.delete(family);
        log.info("Employee family deleted: familyId={}", familyId);
    }

    private void validateEmployeeExists(UUID employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new NotFoundException("EMP_001", "직원을 찾을 수 없습니다: " + employeeId);
        }
    }

    private EmployeeFamily findByIdAndEmployeeId(UUID familyId, UUID employeeId) {
        return employeeFamilyRepository.findById(familyId)
            .filter(f -> f.getEmployeeId().equals(employeeId))
            .orElseThrow(() -> new NotFoundException("EMP_002", "가족 정보를 찾을 수 없습니다: " + familyId));
    }
}

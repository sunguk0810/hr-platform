package com.hrsaas.mdm.repository;

import com.hrsaas.mdm.domain.entity.CodeUsageMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * 코드 사용처 매핑 리포지토리
 */
@Repository
public interface CodeUsageMappingRepository extends JpaRepository<CodeUsageMapping, UUID> {

    List<CodeUsageMapping> findByGroupCode(String groupCode);

    List<CodeUsageMapping> findByGroupCodeIn(List<String> groupCodes);

    void deleteByGroupCodeAndResourceTypeAndResourceName(String groupCode, String resourceType, String resourceName);

    boolean existsByGroupCodeAndResourceTypeAndResourceName(String groupCode, String resourceType, String resourceName);
}

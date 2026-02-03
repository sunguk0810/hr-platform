package com.hrsaas.file.repository;

import com.hrsaas.file.domain.entity.FileMetadata;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, UUID> {

    Optional<FileMetadata> findByStoredName(String storedName);

    @Query("SELECT f FROM FileMetadata f WHERE f.tenantId = :tenantId AND f.referenceType = :referenceType " +
           "AND f.referenceId = :referenceId ORDER BY f.createdAt DESC")
    List<FileMetadata> findByReference(@Param("tenantId") UUID tenantId,
                                        @Param("referenceType") String referenceType,
                                        @Param("referenceId") UUID referenceId);

    @Query("SELECT f FROM FileMetadata f WHERE f.tenantId = :tenantId AND f.uploaderId = :uploaderId " +
           "ORDER BY f.createdAt DESC")
    Page<FileMetadata> findByUploaderId(@Param("tenantId") UUID tenantId,
                                         @Param("uploaderId") UUID uploaderId,
                                         Pageable pageable);

    @Query("SELECT SUM(f.fileSize) FROM FileMetadata f WHERE f.tenantId = :tenantId")
    Long getTotalStorageByTenant(@Param("tenantId") UUID tenantId);
}

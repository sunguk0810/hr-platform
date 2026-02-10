package com.hrsaas.recruitment.scheduler;

import com.hrsaas.recruitment.domain.entity.Applicant;
import com.hrsaas.recruitment.repository.ApplicantRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PrivacyPurgeSchedulerTest {

    @Mock
    private ApplicantRepository applicantRepository;

    @InjectMocks
    private PrivacyPurgeScheduler scheduler;

    @Test
    @DisplayName("purgeExpiredPersonalData - no expired applicants - does nothing")
    void purgeExpiredPersonalData_noExpired_doesNothing() {
        when(applicantRepository.findExpiredForPurge(any(Instant.class)))
                .thenReturn(Collections.emptyList());

        scheduler.purgeExpiredPersonalData();

        verify(applicantRepository, never()).save(any());
    }

    @Test
    @DisplayName("purgeExpiredPersonalData - expired applicants - purges PII")
    void purgeExpiredPersonalData_expiredExists_purgesPii() {
        Applicant applicant = Applicant.builder()
                .name("홍길동")
                .email("hong@example.com")
                .phone("010-1234-5678")
                .address("서울시 강남구")
                .gender("M")
                .build();

        when(applicantRepository.findExpiredForPurge(any(Instant.class)))
                .thenReturn(List.of(applicant));

        scheduler.purgeExpiredPersonalData();

        verify(applicantRepository).save(applicant);
        assertThat(applicant.getName()).isEqualTo("삭제된 지원자");
        assertThat(applicant.getEmail()).isEqualTo("purged@deleted.local");
        assertThat(applicant.getPhone()).isNull();
        assertThat(applicant.getAddress()).isNull();
        assertThat(applicant.getGender()).isNull();
        assertThat(applicant.getBirthDate()).isNull();
        assertThat(applicant.getResumeFileId()).isNull();
        assertThat(applicant.getNotes()).contains("자동 파기");
    }

    @Test
    @DisplayName("purgeExpiredPersonalData - save fails for one - continues others")
    void purgeExpiredPersonalData_partialFailure_continuesProcessing() {
        Applicant applicant1 = Applicant.builder().name("실패").email("fail@test.com").build();
        Applicant applicant2 = Applicant.builder().name("성공").email("ok@test.com").build();

        when(applicantRepository.findExpiredForPurge(any(Instant.class)))
                .thenReturn(List.of(applicant1, applicant2));
        when(applicantRepository.save(applicant1)).thenThrow(new RuntimeException("DB error"));
        when(applicantRepository.save(applicant2)).thenReturn(applicant2);

        scheduler.purgeExpiredPersonalData();

        verify(applicantRepository, times(2)).save(any(Applicant.class));
        // applicant2 should still be purged even though applicant1 failed
        assertThat(applicant2.getName()).isEqualTo("삭제된 지원자");
    }
}

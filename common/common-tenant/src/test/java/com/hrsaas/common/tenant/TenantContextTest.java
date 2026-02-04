package com.hrsaas.common.tenant;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("TenantContext Tests")
class TenantContextTest {

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Nested
    @DisplayName("Tenant ID Management")
    class TenantIdManagement {

        @Test
        @DisplayName("setCurrentTenant/getCurrentTenant: 테넌트 ID 설정 및 조회")
        void setAndGetCurrentTenant_validUuid_returnsSameUuid() {
            UUID tenantId = UUID.randomUUID();

            TenantContext.setCurrentTenant(tenantId);

            assertThat(TenantContext.getCurrentTenant()).isEqualTo(tenantId);
        }

        @Test
        @DisplayName("getCurrentTenant: 설정 전에는 null 반환")
        void getCurrentTenant_notSet_returnsNull() {
            assertThat(TenantContext.getCurrentTenant()).isNull();
        }

        @Test
        @DisplayName("setCurrentTenant: 여러 번 설정하면 마지막 값")
        void setCurrentTenant_multipleTimes_returnsLastValue() {
            UUID first = UUID.randomUUID();
            UUID second = UUID.randomUUID();

            TenantContext.setCurrentTenant(first);
            TenantContext.setCurrentTenant(second);

            assertThat(TenantContext.getCurrentTenant()).isEqualTo(second);
        }
    }

    @Nested
    @DisplayName("Tenant Code Management")
    class TenantCodeManagement {

        @Test
        @DisplayName("setTenantCode/getTenantCode: 테넌트 코드 설정 및 조회")
        void setAndGetTenantCode_validCode_returnsSameCode() {
            String tenantCode = "TENANT001";

            TenantContext.setTenantCode(tenantCode);

            assertThat(TenantContext.getTenantCode()).isEqualTo(tenantCode);
        }

        @Test
        @DisplayName("getTenantCode: 설정 전에는 null 반환")
        void getTenantCode_notSet_returnsNull() {
            assertThat(TenantContext.getTenantCode()).isNull();
        }
    }

    @Nested
    @DisplayName("Tenant Name Management")
    class TenantNameManagement {

        @Test
        @DisplayName("setTenantName/getTenantName: 테넌트 이름 설정 및 조회")
        void setAndGetTenantName_validName_returnsSameName() {
            String tenantName = "삼성전자";

            TenantContext.setTenantName(tenantName);

            assertThat(TenantContext.getTenantName()).isEqualTo(tenantName);
        }

        @Test
        @DisplayName("getTenantName: 설정 전에는 null 반환")
        void getTenantName_notSet_returnsNull() {
            assertThat(TenantContext.getTenantName()).isNull();
        }
    }

    @Nested
    @DisplayName("TenantInfo Management")
    class TenantInfoManagement {

        @Test
        @DisplayName("setTenantInfo/getTenantInfo: TenantInfo 객체 설정 및 조회")
        void setAndGetTenantInfo_validInfo_returnsSameInfo() {
            TenantInfo info = new TenantInfo();
            info.setTenantId(UUID.randomUUID());
            info.setTenantCode("CODE001");
            info.setTenantName("테스트 테넌트");

            TenantContext.setTenantInfo(info);

            TenantInfo result = TenantContext.getTenantInfo();
            assertThat(result).isNotNull();
            assertThat(result.getTenantId()).isEqualTo(info.getTenantId());
            assertThat(result.getTenantCode()).isEqualTo("CODE001");
            assertThat(result.getTenantName()).isEqualTo("테스트 테넌트");
        }

        @Test
        @DisplayName("getTenantInfo: 설정 전에는 null 반환")
        void getTenantInfo_notSet_returnsNull() {
            assertThat(TenantContext.getTenantInfo()).isNull();
        }
    }

    @Nested
    @DisplayName("Clear Method")
    class ClearMethod {

        @Test
        @DisplayName("clear: 모든 테넌트 정보 초기화")
        void clear_afterSettingValues_removesAllInfo() {
            TenantContext.setCurrentTenant(UUID.randomUUID());
            TenantContext.setTenantCode("CODE001");
            TenantContext.setTenantName("테스트 테넌트");

            TenantContext.clear();

            assertThat(TenantContext.getCurrentTenant()).isNull();
            assertThat(TenantContext.getTenantCode()).isNull();
            assertThat(TenantContext.getTenantName()).isNull();
            assertThat(TenantContext.getTenantInfo()).isNull();
        }
    }

    @Nested
    @DisplayName("hasTenant Method")
    class HasTenantMethod {

        @Test
        @DisplayName("hasTenant: 테넌트 ID 설정됨 -> true")
        void hasTenant_tenantIdSet_returnsTrue() {
            TenantContext.setCurrentTenant(UUID.randomUUID());

            assertThat(TenantContext.hasTenant()).isTrue();
        }

        @Test
        @DisplayName("hasTenant: 테넌트 ID 없음 -> false")
        void hasTenant_tenantIdNotSet_returnsFalse() {
            assertThat(TenantContext.hasTenant()).isFalse();
        }

        @Test
        @DisplayName("hasTenant: 다른 정보만 있고 ID 없음 -> false")
        void hasTenant_onlyCodeAndNameSet_returnsFalse() {
            TenantContext.setTenantCode("CODE001");
            TenantContext.setTenantName("테스트");

            assertThat(TenantContext.hasTenant()).isFalse();
        }
    }

    @Nested
    @DisplayName("Thread Safety")
    class ThreadSafety {

        @Test
        @DisplayName("다른 스레드는 독립적인 컨텍스트를 가짐")
        void differentThreads_haveIsolatedContext() throws InterruptedException {
            UUID mainThreadTenant = UUID.randomUUID();
            UUID otherThreadTenant = UUID.randomUUID();

            TenantContext.setCurrentTenant(mainThreadTenant);

            AtomicReference<UUID> otherThreadResult = new AtomicReference<>();
            AtomicReference<UUID> otherThreadOwnTenant = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            Thread otherThread = new Thread(() -> {
                // 다른 스레드에서는 메인 스레드의 테넌트를 볼 수 없어야 함
                otherThreadResult.set(TenantContext.getCurrentTenant());

                // 다른 스레드에서 자체 테넌트 설정
                TenantContext.setCurrentTenant(otherThreadTenant);
                otherThreadOwnTenant.set(TenantContext.getCurrentTenant());

                TenantContext.clear();
                latch.countDown();
            });

            otherThread.start();
            latch.await();

            // 다른 스레드는 처음에 null을 봤어야 함
            assertThat(otherThreadResult.get()).isNull();

            // 다른 스레드는 자신의 테넌트를 설정할 수 있어야 함
            assertThat(otherThreadOwnTenant.get()).isEqualTo(otherThreadTenant);

            // 메인 스레드의 테넌트는 영향받지 않아야 함
            assertThat(TenantContext.getCurrentTenant()).isEqualTo(mainThreadTenant);
        }

        @Test
        @DisplayName("여러 스레드가 동시에 독립적으로 동작")
        void multipleThreads_workIndependently() throws InterruptedException {
            int threadCount = 10;
            ExecutorService executor = Executors.newFixedThreadPool(threadCount);
            CountDownLatch latch = new CountDownLatch(threadCount);
            AtomicReference<AssertionError> error = new AtomicReference<>();

            for (int i = 0; i < threadCount; i++) {
                final UUID expectedTenant = UUID.randomUUID();
                final String expectedCode = "CODE_" + i;

                executor.submit(() -> {
                    try {
                        TenantContext.setCurrentTenant(expectedTenant);
                        TenantContext.setTenantCode(expectedCode);

                        // 다른 스레드가 끼어들 시간을 줌
                        Thread.sleep(10);

                        // 자신이 설정한 값이 그대로 있어야 함
                        assertThat(TenantContext.getCurrentTenant()).isEqualTo(expectedTenant);
                        assertThat(TenantContext.getTenantCode()).isEqualTo(expectedCode);
                    } catch (AssertionError e) {
                        error.set(e);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    } finally {
                        TenantContext.clear();
                        latch.countDown();
                    }
                });
            }

            latch.await();
            executor.shutdown();

            if (error.get() != null) {
                throw error.get();
            }
        }
    }

    @Nested
    @DisplayName("Mixed Operations")
    class MixedOperations {

        @Test
        @DisplayName("개별 setter와 TenantInfo가 같은 저장소 공유")
        void individualSettersAndTenantInfo_shareSameStorage() {
            UUID tenantId = UUID.randomUUID();

            // 개별 setter로 설정
            TenantContext.setCurrentTenant(tenantId);
            TenantContext.setTenantCode("CODE001");

            // TenantInfo로 조회
            TenantInfo info = TenantContext.getTenantInfo();
            assertThat(info).isNotNull();
            assertThat(info.getTenantId()).isEqualTo(tenantId);
            assertThat(info.getTenantCode()).isEqualTo("CODE001");
        }

        @Test
        @DisplayName("TenantInfo 설정 후 개별 getter로 조회")
        void setTenantInfo_thenGetIndividualFields() {
            TenantInfo info = new TenantInfo();
            info.setTenantId(UUID.randomUUID());
            info.setTenantCode("CODE002");
            info.setTenantName("테스트");

            TenantContext.setTenantInfo(info);

            assertThat(TenantContext.getCurrentTenant()).isEqualTo(info.getTenantId());
            assertThat(TenantContext.getTenantCode()).isEqualTo("CODE002");
            assertThat(TenantContext.getTenantName()).isEqualTo("테스트");
        }
    }
}

package com.hrsaas.appointment.service;

import com.hrsaas.appointment.domain.dto.request.*;
import com.hrsaas.appointment.domain.dto.response.AppointmentDraftResponse;
import com.hrsaas.appointment.domain.entity.DraftStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface AppointmentDraftService {

    AppointmentDraftResponse create(CreateAppointmentDraftRequest request);

    AppointmentDraftResponse getById(UUID id);

    AppointmentDraftResponse getByDraftNumber(String draftNumber);

    Page<AppointmentDraftResponse> search(DraftStatus status, LocalDate startDate,
                                          LocalDate endDate, Pageable pageable);

    AppointmentDraftResponse update(UUID id, UpdateAppointmentDraftRequest request);

    void delete(UUID id);

    AppointmentDraftResponse addDetail(UUID draftId, CreateAppointmentDetailRequest request);

    void removeDetail(UUID draftId, UUID detailId);

    AppointmentDraftResponse submit(UUID id);

    AppointmentDraftResponse execute(UUID id);

    AppointmentDraftResponse schedule(UUID id, ScheduleAppointmentRequest request);

    AppointmentDraftResponse cancel(UUID id, CancelAppointmentRequest request);

    AppointmentDraftResponse rollback(UUID id);
}

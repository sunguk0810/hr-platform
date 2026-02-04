package com.hrsaas.attendance.domain.dto.request;

import jakarta.validation.constraints.Size;

public record CheckOutRequest(
    @Size(max = 200)
    String location,

    @Size(max = 500)
    String note
) {}

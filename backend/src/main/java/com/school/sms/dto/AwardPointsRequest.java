package com.school.sms.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Positive = award, negative = deduct/adjust. Zero is rejected. */
public record AwardPointsRequest(
        @NotNull(message = "Points value is required")
        @Min(value = -1000, message = "Points must be between -1000 and 1000")
        @Max(value = 1000, message = "Points must be between -1000 and 1000")
        Integer points) {
}

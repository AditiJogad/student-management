package com.school.sms.dto;

import com.school.sms.entity.Role;
import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 150, message = "Email must be at most 150 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 6, max = 72, message = "Password must be 6-72 characters")
        String password,

        @NotNull(message = "Role is required (STUDENT or TEACHER)")
        Role role) {
}

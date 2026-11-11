package com.school.sms.dto;

/** Session payload: JWT + user profile (which carries the role). */
public record AuthResponse(String token, UserDto user) {
}

package com.school.sms.security;

import com.school.sms.entity.Role;

/** What the JWT filter puts in the SecurityContext. */
public record AuthPrincipal(Long userId, String email, Role role) {
}

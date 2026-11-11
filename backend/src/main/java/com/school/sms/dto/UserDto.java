package com.school.sms.dto;

import com.school.sms.entity.Role;
import com.school.sms.entity.User;

public record UserDto(Long id, String name, String email, Role role) {
    public static UserDto from(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole());
    }
}

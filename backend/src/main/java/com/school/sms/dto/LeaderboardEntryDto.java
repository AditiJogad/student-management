package com.school.sms.dto;

public record LeaderboardEntryDto(
        long rank,
        Long studentId,
        Long userId,
        String name,
        String email,
        int points) {
}

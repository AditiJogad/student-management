package com.school.sms.service;

import com.school.sms.dto.LeaderboardEntryDto;
import com.school.sms.dto.PageResponse;
import com.school.sms.entity.StudentProfile;
import com.school.sms.exception.ApiException;
import com.school.sms.repository.StudentProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class LeaderboardService {

    /** Client-facing sort keys -> entity property paths (whitelist prevents arbitrary property sorting). */
    private static final Map<String, String> SORTABLE = Map.of(
            "points", "points",
            "name", "user.name");

    private static final int MAX_PAGE_SIZE = 100;

    private final StudentProfileRepository profiles;

    public LeaderboardService(StudentProfileRepository profiles) {
        this.profiles = profiles;
    }

    @Transactional(readOnly = true)
    public PageResponse<LeaderboardEntryDto> list(int page, int size, String sortBy, String direction) {
        String key = sortBy == null ? "points" : sortBy.toLowerCase();
        String property = SORTABLE.get(key);
        if (property == null) {
            throw ApiException.badRequest("sortBy must be one of: " + String.join(", ", SORTABLE.keySet()));
        }
        Sort.Direction dir;
        try {
            dir = direction == null ? Sort.Direction.DESC : Sort.Direction.fromString(direction);
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("direction must be 'asc' or 'desc'");
        }
        if (page < 0) throw ApiException.badRequest("page must be >= 0");
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw ApiException.badRequest("size must be between 1 and " + MAX_PAGE_SIZE);
        }

        // Secondary key (id ASC) makes the order fully deterministic when values tie.
        Sort sort = Sort.by(dir, property).and(Sort.by(Sort.Direction.ASC, "id"));
        Page<LeaderboardEntryDto> result = profiles.findAll(PageRequest.of(page, size, sort))
                .map(this::toEntry);
        return PageResponse.of(result, key, dir.name().toLowerCase());
    }

    @Transactional(readOnly = true)
    public LeaderboardEntryDto forUser(Long userId) {
        return profiles.findByUserId(userId).map(this::toEntry)
                .orElseThrow(() -> ApiException.notFound("No student profile for this account"));
    }

    @Transactional
    public LeaderboardEntryDto awardPoints(Long studentId, int delta) {
        if (delta == 0) throw ApiException.badRequest("Points value must not be zero");
        StudentProfile sp = profiles.findWithUserById(studentId)
                .orElseThrow(() -> ApiException.notFound("Student " + studentId + " not found"));
        long updated = (long) sp.getPoints() + delta;
        if (updated < 0) {
            throw ApiException.badRequest("Student only has " + sp.getPoints()
                    + " points; total cannot go below 0");
        }
        sp.setPoints((int) updated);
        profiles.saveAndFlush(sp);
        return toEntry(sp);
    }

    /**
     * Rank = 1 + number of students strictly ahead, where "ahead" means more points,
     * or equal points and a lower id. Unique and deterministic, and independent of
     * how the client chose to sort the page.
     */
    private LeaderboardEntryDto toEntry(StudentProfile sp) {
        long rank = profiles.countAhead(sp.getPoints(), sp.getId()) + 1;
        return new LeaderboardEntryDto(rank, sp.getId(), sp.getUser().getId(),
                sp.getUser().getName(), sp.getUser().getEmail(), sp.getPoints());
    }
}

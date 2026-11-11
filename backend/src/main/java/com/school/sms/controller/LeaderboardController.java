package com.school.sms.controller;

import com.school.sms.dto.AwardPointsRequest;
import com.school.sms.dto.LeaderboardEntryDto;
import com.school.sms.dto.PageResponse;
import com.school.sms.security.AuthPrincipal;
import com.school.sms.service.LeaderboardService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService service;

    public LeaderboardController(LeaderboardService service) {
        this.service = service;
    }

    /** GET /api/leaderboard?page=0&size=10&sortBy=points&direction=desc  (any logged-in user) */
    @GetMapping
    public PageResponse<LeaderboardEntryDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "points") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        return service.list(page, size, sortBy, direction);
    }

    /** The caller's own standing (STUDENT accounts). */
    @GetMapping("/me")
    public LeaderboardEntryDto me(@AuthenticationPrincipal AuthPrincipal principal) {
        return service.forUser(principal.userId());
    }

    /** TEACHER only. Body: {"points": 10} to award, {"points": -5} to deduct. */
    @PostMapping("/{studentId}/points")
    @PreAuthorize("hasRole('TEACHER')")
    public LeaderboardEntryDto award(@PathVariable Long studentId,
                                     @Valid @RequestBody AwardPointsRequest req) {
        return service.awardPoints(studentId, req.points());
    }
}

package com.school.sms.repository;

import com.school.sms.entity.StudentProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {

    /** Paged + sorted leaderboard; fetches the user in the same query (no N+1). */
    @Override
    @EntityGraph(attributePaths = "user")
    Page<StudentProfile> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "user")
    Optional<StudentProfile> findByUserId(Long userId);

    @EntityGraph(attributePaths = "user")
    Optional<StudentProfile> findWithUserById(Long id);

    /**
     * How many students are ranked strictly ahead of the given one.
     * Ranking order is: points DESC, then id ASC (earlier sign-up wins a tie),
     * so rank is always deterministic and unique.
     */
    @Query("select count(sp) from StudentProfile sp " +
            "where sp.points > :points or (sp.points = :points and sp.id < :id)")
    long countAhead(@Param("points") int points, @Param("id") Long id);
}

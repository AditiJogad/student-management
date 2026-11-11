package com.school.sms.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Check;

/**
 * Running point tally for a STUDENT user. One-to-one with {@link User}
 * (unique FK), points can never go negative (DB check constraint + default 0).
 */
@Entity
@Table(name = "student_profiles", indexes = {
        @Index(name = "idx_student_points", columnList = "points")
})
@Check(constraints = "points >= 0")
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true,
            foreignKey = @ForeignKey(name = "fk_student_user"))
    private User user;

    @Column(nullable = false)
    private int points = 0;

    /** Optimistic locking so two teachers awarding points at once never lose an update. */
    @Version
    private long version;

    protected StudentProfile() {
    }

    public StudentProfile(User user) {
        this.user = user;
        this.points = 0;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }
}

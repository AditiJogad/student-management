package com.school.sms.config;

import com.school.sms.entity.Role;
import com.school.sms.entity.StudentProfile;
import com.school.sms.entity.User;
import com.school.sms.repository.StudentProfileRepository;
import com.school.sms.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Creates demo accounts on first start so the live demo has data. Password for all: password123 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository users;
    private final StudentProfileRepository profiles;
    private final PasswordEncoder encoder;
    private final boolean enabled;

    public DataSeeder(UserRepository users, StudentProfileRepository profiles, PasswordEncoder encoder,
                      @Value("${app.seed.enabled}") boolean enabled) {
        this.users = users;
        this.profiles = profiles;
        this.encoder = encoder;
        this.enabled = enabled;
    }

    @Override
    public void run(String... args) {
        if (!enabled || users.count() > 0) return;

        users.save(new User("Mrs. Sharma", "teacher@school.com", encoder.encode("password123"), Role.TEACHER));

        Object[][] students = {
                {"Aarav Patel", "aarav@school.com", 85}, {"Diya Singh", "diya@school.com", 92},
                {"Kabir Mehta", "kabir@school.com", 78}, {"Ananya Rao", "ananya@school.com", 92},
                {"Vihaan Gupta", "vihaan@school.com", 64}, {"Isha Nair", "isha@school.com", 71},
                {"Rohan Joshi", "rohan@school.com", 55}, {"Meera Iyer", "meera@school.com", 88},
                {"Arjun Reddy", "arjun@school.com", 47}, {"Saanvi Das", "saanvi@school.com", 69},
                {"Aditya Verma", "aditya@school.com", 81}, {"Kiara Shah", "kiara@school.com", 90},
        };
        for (Object[] s : students) {
            User u = users.save(new User((String) s[0], (String) s[1], encoder.encode("password123"), Role.STUDENT));
            StudentProfile sp = new StudentProfile(u);
            sp.setPoints((Integer) s[2]);
            profiles.save(sp);
        }
        log.info("Seeded demo data. Teacher: teacher@school.com / Student: aarav@school.com (password: password123)");
    }
}

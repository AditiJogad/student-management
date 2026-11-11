package com.school.sms.service;

import com.school.sms.dto.AuthResponse;
import com.school.sms.dto.LoginRequest;
import com.school.sms.dto.RegisterRequest;
import com.school.sms.dto.UserDto;
import com.school.sms.entity.Role;
import com.school.sms.entity.StudentProfile;
import com.school.sms.entity.User;
import com.school.sms.exception.ApiException;
import com.school.sms.repository.StudentProfileRepository;
import com.school.sms.repository.UserRepository;
import com.school.sms.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final StudentProfileRepository profiles;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, StudentProfileRepository profiles,
                       PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.profiles = profiles;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User user = users.save(new User(req.name().trim(), email, encoder.encode(req.password()), req.role()));
        if (user.getRole() == Role.STUDENT) {
            profiles.save(new StudentProfile(user));
        }
        return new AuthResponse(jwt.generate(user), UserDto.from(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = users.findByEmailIgnoreCase(req.email().trim())
                .filter(u -> encoder.matches(req.password(), u.getPassword()))
                .orElseThrow(() -> new BadCredentialsException("bad credentials"));
        return new AuthResponse(jwt.generate(user), UserDto.from(user));
    }

    @Transactional(readOnly = true)
    public UserDto me(Long userId) {
        return users.findById(userId).map(UserDto::from)
                .orElseThrow(() -> ApiException.notFound("User no longer exists"));
    }
}

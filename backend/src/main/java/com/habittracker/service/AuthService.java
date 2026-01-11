package com.habittracker.service;

import com.habittracker.dto.JwtResponse;
import com.habittracker.dto.LoginRequest;
import com.habittracker.dto.PasswordResetConfirmRequest;
import com.habittracker.dto.SignupRequest;
import com.habittracker.entity.User;
import com.habittracker.repository.UserRepository;
import com.habittracker.security.JwtUtils;
import com.habittracker.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;

    @Transactional
    public JwtResponse login(LoginRequest loginRequest) {
        // Check if user exists first
        if (!userRepository.existsByUsername(loginRequest.getUsername())) {
            throw new RuntimeException("존재하지 않는 아이디입니다.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Long familyId = user.getFamily() != null ? user.getFamily().getId() : null;
            String familyName = user.getFamily() != null ? user.getFamily().getName() : null;

            return new JwtResponse(
                    jwt,
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getDisplayName(),
                    familyId,
                    familyName
            );
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            throw new RuntimeException("비밀번호가 틀렸습니다.");
        }
    }

    @Transactional
    public String signup(SignupRequest signupRequest) {
        if (userRepository.existsByUsername(signupRequest.getUsername())) {
            throw new RuntimeException("Error: Username is already taken!");
        }

        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user = User.builder()
                .username(signupRequest.getUsername())
                .email(signupRequest.getEmail())
                .password(passwordEncoder.encode(signupRequest.getPassword()))
                .displayName(signupRequest.getDisplayName())
                .build();

        userRepository.save(user);

        return "User registered successfully!";
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public User updateDisplayName(String newDisplayName) {
        User currentUser = getCurrentUser();
        currentUser.setDisplayName(newDisplayName);
        return userRepository.save(currentUser);
    }

    @Transactional
    public void deleteAccount() {
        User currentUser = getCurrentUser();

        // User entity will cascade delete:
        // - Habits (owned by user)
        // - HabitLogs (created by user)
        // - PushSubscriptions (for user)
        // Family membership will be removed (ManyToOne)

        userRepository.delete(currentUser);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        // Always return success to prevent email enumeration attacks
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);

            emailService.sendPasswordResetEmail(email, token);
        });
    }

    @Transactional
    public void resetPassword(PasswordResetConfirmRequest request) {
        User user = userRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("유효하지 않은 토큰입니다."));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("토큰이 만료되었습니다. 비밀번호 찾기를 다시 시도해주세요.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }
}

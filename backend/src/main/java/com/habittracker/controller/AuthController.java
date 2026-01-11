package com.habittracker.controller;

import com.habittracker.dto.JwtResponse;
import com.habittracker.dto.LoginRequest;
import com.habittracker.dto.PasswordResetConfirmRequest;
import com.habittracker.dto.PasswordResetRequest;
import com.habittracker.dto.SignupRequest;
import com.habittracker.entity.User;
import com.habittracker.repository.UserRepository;
import com.habittracker.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            JwtResponse response = authService.login(loginRequest);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@Valid @RequestBody SignupRequest signupRequest) {
        String message = authService.signup(signupRequest);
        return ResponseEntity.ok(message);
    }

    @PutMapping("/settings/reminders")
    public ResponseEntity<Map<String, Object>> updateReminderSettings(
            Authentication authentication,
            @RequestBody Map<String, Object> settings
    ) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (settings.containsKey("enableReminders")) {
            user.setEnableReminders((Boolean) settings.get("enableReminders"));
        }
        if (settings.containsKey("reminderTime")) {
            String reminderTime = (String) settings.get("reminderTime");
            // Validate format HH:mm
            if (reminderTime != null && reminderTime.matches("^([01]?[0-9]|2[0-3]):[0-5][0-9]$")) {
                user.setReminderTime(reminderTime);
            }
        }
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "enableReminders", user.getEnableReminders(),
                "reminderTime", user.getReminderTime() != null ? user.getReminderTime() : "21:00"
        ));
    }

    @GetMapping("/settings/reminders")
    public ResponseEntity<Map<String, Object>> getReminderSettings(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(Map.of(
                "enableReminders", user.getEnableReminders(),
                "reminderTime", user.getReminderTime() != null ? user.getReminderTime() : "21:00"
        ));
    }

    @PutMapping("/profile/display-name")
    public ResponseEntity<Map<String, String>> updateDisplayName(@RequestBody Map<String, String> request) {
        String newDisplayName = request.get("displayName");
        if (newDisplayName == null || newDisplayName.trim().isEmpty()) {
            throw new RuntimeException("Display name cannot be empty");
        }
        User updatedUser = authService.updateDisplayName(newDisplayName.trim());
        return ResponseEntity.ok(Map.of("displayName", updatedUser.getDisplayName()));
    }

    @DeleteMapping("/account")
    public ResponseEntity<String> deleteAccount() {
        authService.deleteAccount();
        return ResponseEntity.ok("Account deleted successfully");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody PasswordResetRequest request) {
        authService.requestPasswordReset(request.getEmail());
        // Always return success to prevent email enumeration
        return ResponseEntity.ok(Map.of("message", "비밀번호 재설정 이메일이 발송되었습니다."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody PasswordResetConfirmRequest request) {
        try {
            authService.resetPassword(request);
            return ResponseEntity.ok(Map.of("message", "비밀번호가 성공적으로 변경되었습니다."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

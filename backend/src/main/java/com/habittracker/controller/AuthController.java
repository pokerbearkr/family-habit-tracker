package com.habittracker.controller;

import com.habittracker.dto.JwtResponse;
import com.habittracker.dto.LoginRequest;
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
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        JwtResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@Valid @RequestBody SignupRequest signupRequest) {
        String message = authService.signup(signupRequest);
        return ResponseEntity.ok(message);
    }

    @PutMapping("/settings/reminders")
    public ResponseEntity<Map<String, Boolean>> updateReminderSettings(
            Authentication authentication,
            @RequestBody Map<String, Boolean> settings
    ) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Boolean enableReminders = settings.get("enableReminders");
        if (enableReminders != null) {
            user.setEnableReminders(enableReminders);
            userRepository.save(user);
        }

        return ResponseEntity.ok(Map.of("enableReminders", user.getEnableReminders()));
    }

    @GetMapping("/settings/reminders")
    public ResponseEntity<Map<String, Boolean>> getReminderSettings(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(Map.of("enableReminders", user.getEnableReminders()));
    }

    @DeleteMapping("/account")
    public ResponseEntity<String> deleteAccount() {
        authService.deleteAccount();
        return ResponseEntity.ok("Account deleted successfully");
    }
}

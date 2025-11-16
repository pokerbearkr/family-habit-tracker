package com.habittracker.controller;

import com.habittracker.dto.PushSubscriptionRequest;
import com.habittracker.entity.User;
import com.habittracker.service.AuthService;
import com.habittracker.service.PushNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/push")
public class PushController {

    private final PushNotificationService pushNotificationService;
    private final AuthService authService;

    public PushController(PushNotificationService pushNotificationService, AuthService authService) {
        this.pushNotificationService = pushNotificationService;
        this.authService = authService;
    }

    @GetMapping("/vapid-public-key")
    public ResponseEntity<Map<String, String>> getVapidPublicKey() {
        Map<String, String> response = new HashMap<>();
        response.put("publicKey", pushNotificationService.getPublicKey());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody PushSubscriptionRequest request) {
        try {
            User user = authService.getCurrentUser();
            pushNotificationService.subscribe(
                user,
                request.getEndpoint(),
                request.getKeys().getP256dh(),
                request.getKeys().getAuth()
            );
            return ResponseEntity.ok().body(Map.of("message", "구독 성공"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/unsubscribe")
    public ResponseEntity<?> unsubscribe(@RequestBody Map<String, String> request) {
        try {
            User user = authService.getCurrentUser();
            pushNotificationService.unsubscribe(user, request.get("endpoint"));
            return ResponseEntity.ok().body(Map.of("message", "구독 취소 성공"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

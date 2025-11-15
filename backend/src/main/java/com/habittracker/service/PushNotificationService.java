package com.habittracker.service;

import com.habittracker.entity.User;
import com.habittracker.model.PushSubscription;
import com.habittracker.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.GeneralSecurityException;
import java.util.List;

@Service
public class PushNotificationService {

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final PushService pushService;

    @Value("${vapid.public.key}")
    private String publicKey;

    @Value("${vapid.private.key}")
    private String privateKey;

    @Value("${vapid.subject}")
    private String subject;

    public PushNotificationService(PushSubscriptionRepository pushSubscriptionRepository) {
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.pushService = new PushService();
    }

    public void initKeys() throws GeneralSecurityException {
        pushService.setPublicKey(publicKey);
        pushService.setPrivateKey(privateKey);
        pushService.setSubject(subject);
    }

    @Transactional
    public PushSubscription subscribe(User user, String endpoint, String p256dhKey, String authKey) {
        // Check if subscription already exists
        var existing = pushSubscriptionRepository.findByUserAndEndpoint(user, endpoint);
        if (existing.isPresent()) {
            return existing.get();
        }

        PushSubscription subscription = new PushSubscription();
        subscription.setUser(user);
        subscription.setEndpoint(endpoint);
        subscription.setP256dhKey(p256dhKey);
        subscription.setAuthKey(authKey);

        return pushSubscriptionRepository.save(subscription);
    }

    @Transactional
    public void unsubscribe(User user, String endpoint) {
        pushSubscriptionRepository.deleteByUserAndEndpoint(user, endpoint);
    }

    public void sendNotification(User user, String title, String body) {
        try {
            initKeys();
            List<PushSubscription> subscriptions = pushSubscriptionRepository.findByUser(user);

            String payload = String.format(
                "{\"title\":\"%s\",\"body\":\"%s\",\"icon\":\"/logo192.png\",\"badge\":\"/logo192.png\"}",
                escapeJson(title),
                escapeJson(body)
            );

            for (PushSubscription subscription : subscriptions) {
                try {
                    Notification notification = new Notification(
                        subscription.getEndpoint(),
                        subscription.getP256dhKey(),
                        subscription.getAuthKey(),
                        payload
                    );

                    pushService.send(notification);
                } catch (Exception e) {
                    // If push fails, remove invalid subscription
                    System.err.println("Failed to send push notification: " + e.getMessage());
                    pushSubscriptionRepository.delete(subscription);
                }
            }
        } catch (Exception e) {
            System.err.println("Error sending push notifications: " + e.getMessage());
        }
    }

    private String escapeJson(String str) {
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }

    public String getPublicKey() {
        return publicKey;
    }
}

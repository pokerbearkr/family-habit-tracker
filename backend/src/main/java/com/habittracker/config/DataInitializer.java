package com.habittracker.config;

import com.habittracker.entity.Family;
import com.habittracker.entity.Habit;
import com.habittracker.entity.User;
import com.habittracker.repository.FamilyRepository;
import com.habittracker.repository.HabitRepository;
import com.habittracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final HabitRepository habitRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Check if testuser already exists
        if (userRepository.findByUsername("testuser").isPresent()) {
            System.out.println("Test data already exists. Skipping initialization.");
            return;
        }

        System.out.println("Initializing test data...");

        // Create test family
        Family testFamily = Family.builder()
                .name("Test Family")
                .inviteCode(generateUniqueInviteCode())
                .build();
        testFamily = familyRepository.save(testFamily);

        // Create test user
        User testUser = User.builder()
                .username("testuser")
                .email("test@test.com")
                .password(passwordEncoder.encode("test123"))
                .displayName("Test User")
                .family(testFamily)
                .build();
        userRepository.save(testUser);

        // Create test user 2
        User testUser2 = User.builder()
                .username("testuser2")
                .email("test2@test.com")
                .password(passwordEncoder.encode("test123"))
                .displayName("Test User 2")
                .family(testFamily)
                .build();
        userRepository.save(testUser2);

        // Create sample habits for testuser
        Habit habit1 = Habit.builder()
                .name("운동하기")
                .description("매일 30분 운동")
                .color("#007bff")
                .user(testUser)
                .family(testFamily)
                .build();
        habitRepository.save(habit1);

        Habit habit2 = Habit.builder()
                .name("독서하기")
                .description("하루 20페이지 책 읽기")
                .color("#28a745")
                .user(testUser)
                .family(testFamily)
                .build();
        habitRepository.save(habit2);

        // Create sample habits for testuser2
        Habit habit3 = Habit.builder()
                .name("물 마시기")
                .description("하루 8잔 물 마시기")
                .color("#17a2b8")
                .user(testUser2)
                .family(testFamily)
                .build();
        habitRepository.save(habit3);

        Habit habit4 = Habit.builder()
                .name("명상하기")
                .description("하루 10분 명상")
                .color("#ffc107")
                .user(testUser2)
                .family(testFamily)
                .build();
        habitRepository.save(habit4);

        System.out.println("===========================================");
        System.out.println("✅ Test data initialized successfully!");
        System.out.println("===========================================");
        System.out.println("Test Account 1:");
        System.out.println("  Username: testuser");
        System.out.println("  Password: test123");
        System.out.println("Test Account 2:");
        System.out.println("  Username: testuser2");
        System.out.println("  Password: test123");
        System.out.println("Family:");
        System.out.println("  Name: Test Family");
        System.out.println("  Invite Code: " + testFamily.getInviteCode());
        System.out.println("===========================================");
    }

    private String generateUniqueInviteCode() {
        String inviteCode;
        do {
            inviteCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (familyRepository.existsByInviteCode(inviteCode));
        return inviteCode;
    }
}

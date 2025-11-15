package com.habittracker.service;

import com.habittracker.dto.HabitLogUpdateMessage;
import com.habittracker.dto.LogHabitRequest;
import com.habittracker.entity.Habit;
import com.habittracker.entity.HabitLog;
import com.habittracker.entity.User;
import com.habittracker.repository.HabitLogRepository;
import com.habittracker.repository.HabitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HabitLogService {

    private final HabitLogRepository habitLogRepository;
    private final HabitRepository habitRepository;
    private final AuthService authService;
    private final SimpMessagingTemplate messagingTemplate;
    private final PushNotificationService pushNotificationService;

    @Transactional
    public HabitLog logHabit(LogHabitRequest request) {
        User currentUser = authService.getCurrentUser();
        Habit habit = habitRepository.findById(request.getHabitId())
                .orElseThrow(() -> new RuntimeException("Habit not found"));

        // Check if user is the owner of this habit
        if (!currentUser.getId().equals(habit.getUser().getId())) {
            throw new RuntimeException("Unauthorized to log this habit - you can only log your own habits");
        }

        // Check if log already exists for this date
        HabitLog existingLog = habitLogRepository
                .findByUserAndHabitAndLogDate(currentUser, habit, request.getLogDate())
                .orElse(null);

        HabitLog savedLog;
        if (existingLog != null) {
            // Update existing log
            existingLog.setCompleted(request.getCompleted());
            existingLog.setNote(request.getNote());
            savedLog = habitLogRepository.save(existingLog);
        } else {
            // Create new log
            HabitLog habitLog = HabitLog.builder()
                    .user(currentUser)
                    .habit(habit)
                    .logDate(request.getLogDate())
                    .completed(request.getCompleted())
                    .note(request.getNote())
                    .build();
            savedLog = habitLogRepository.save(habitLog);
        }

        // Broadcast update to family members via WebSocket
        broadcastHabitLogUpdate(savedLog, currentUser, habit);

        // Send push notifications to family members if habit was completed
        if (savedLog.getCompleted() && currentUser.getFamily() != null) {
            sendPushNotificationsToFamily(currentUser, habit);
        }

        return savedLog;
    }

    private void broadcastHabitLogUpdate(HabitLog habitLog, User user, Habit habit) {
        HabitLogUpdateMessage message = new HabitLogUpdateMessage(
                habitLog.getId(),
                habit.getId(),
                habit.getName(),
                user.getId(),
                user.getDisplayName(),
                habitLog.getLogDate(),
                habitLog.getCompleted(),
                habitLog.getNote(),
                user.getFamily().getId()
        );

        messagingTemplate.convertAndSend(
                "/topic/family/" + user.getFamily().getId() + "/habit-updates",
                message
        );
    }

    private void sendPushNotificationsToFamily(User user, Habit habit) {
        // Send push notification to all family members except the current user
        if (user.getFamily() != null) {
            user.getFamily().getMembers().stream()
                .filter(member -> !member.getId().equals(user.getId()))
                .forEach(member -> {
                    String title = user.getDisplayName() + "님이 습관을 완료했습니다!";
                    String body = "\"" + habit.getName() + "\" 습관을 체크했습니다.";
                    pushNotificationService.sendNotification(member, title, body);
                });
        }
    }

    @Transactional(readOnly = true)
    public List<HabitLog> getFamilyLogsForDate(LocalDate date) {
        User currentUser = authService.getCurrentUser();

        if (currentUser.getFamily() == null) {
            throw new RuntimeException("User must belong to a family");
        }

        return habitLogRepository.findByFamilyIdAndLogDate(
                currentUser.getFamily().getId(),
                date
        );
    }

    @Transactional(readOnly = true)
    public List<HabitLog> getFamilyLogsForDateRange(LocalDate startDate, LocalDate endDate) {
        User currentUser = authService.getCurrentUser();

        if (currentUser.getFamily() == null) {
            throw new RuntimeException("User must belong to a family");
        }

        return habitLogRepository.findByFamilyIdAndLogDateBetween(
                currentUser.getFamily().getId(),
                startDate,
                endDate
        );
    }

    @Transactional(readOnly = true)
    public List<HabitLog> getMyLogsForDate(LocalDate date) {
        User currentUser = authService.getCurrentUser();
        return habitLogRepository.findByUserAndLogDate(currentUser, date);
    }

    @Transactional(readOnly = true)
    public com.habittracker.dto.MonthlyStatsResponse getMonthlyStats(int year, int month) {
        User currentUser = authService.getCurrentUser();

        if (currentUser.getFamily() == null) {
            throw new RuntimeException("User must belong to a family");
        }

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        List<HabitLog> logs = habitLogRepository.findByFamilyIdAndLogDateBetween(
                currentUser.getFamily().getId(),
                startDate,
                endDate
        );

        return calculateMonthlyStats(year, month, logs, currentUser.getFamily());
    }

    private com.habittracker.dto.MonthlyStatsResponse calculateMonthlyStats(
            int year, int month, List<HabitLog> logs, com.habittracker.entity.Family family) {

        int daysInMonth = LocalDate.of(year, month, 1).lengthOfMonth();

        // Calculate user stats
        java.util.Map<Long, com.habittracker.dto.MonthlyStatsResponse.UserStats> userStatsMap = new java.util.HashMap<>();
        family.getMembers().forEach(user -> {
            // Count how many habits this user owns
            long userHabitsCount = family.getHabits().stream()
                    .filter(habit -> habit.getUser().getId().equals(user.getId()))
                    .count();

            // Count completed logs for this user's habits
            long completedCount = logs.stream()
                    .filter(log -> log.getUser().getId().equals(user.getId()) && log.getCompleted())
                    .count();

            int totalPossible = (int) userHabitsCount * daysInMonth;

            userStatsMap.put(user.getId(), new com.habittracker.dto.MonthlyStatsResponse.UserStats(
                    user.getId(),
                    user.getUsername(),
                    user.getDisplayName(),
                    (int) userHabitsCount,
                    (int) completedCount,
                    totalPossible,
                    totalPossible > 0 ? (completedCount * 100.0 / totalPossible) : 0
            ));
        });

        // Calculate habit stats
        java.util.Map<Long, com.habittracker.dto.MonthlyStatsResponse.HabitStats> habitStatsMap = new java.util.HashMap<>();
        family.getHabits().forEach(habit -> {
            long completedCount = logs.stream()
                    .filter(log -> log.getHabit().getId().equals(habit.getId()) && log.getCompleted())
                    .count();
            // Each habit belongs to one user, so totalPossible = daysInMonth
            int totalPossible = daysInMonth;

            habitStatsMap.put(habit.getId(), new com.habittracker.dto.MonthlyStatsResponse.HabitStats(
                    habit.getId(),
                    habit.getName(),
                    habit.getColor(),
                    (int) completedCount,
                    totalPossible,
                    totalPossible > 0 ? (completedCount * 100.0 / totalPossible) : 0
            ));
        });

        // Calculate daily stats
        java.util.Map<String, com.habittracker.dto.MonthlyStatsResponse.DayStats> dailyStatsMap = new java.util.HashMap<>();
        // Total possible per day = number of habits (each habit belongs to one user)
        int totalPossiblePerDay = family.getHabits().size();

        for (int day = 1; day <= daysInMonth; day++) {
            LocalDate date = LocalDate.of(year, month, day);
            String dateKey = date.toString();

            List<HabitLog> dayLogs = logs.stream()
                    .filter(log -> log.getLogDate().equals(date))
                    .toList();

            List<com.habittracker.dto.MonthlyStatsResponse.HabitLogSummary> logSummaries = dayLogs.stream()
                    .map(log -> new com.habittracker.dto.MonthlyStatsResponse.HabitLogSummary(
                            log.getHabit().getId(),
                            log.getHabit().getName(),
                            log.getUser().getId(),
                            log.getUser().getDisplayName(),
                            log.getCompleted()
                    ))
                    .toList();

            long completedCount = dayLogs.stream().filter(HabitLog::getCompleted).count();

            dailyStatsMap.put(dateKey, new com.habittracker.dto.MonthlyStatsResponse.DayStats(
                    date,
                    totalPossiblePerDay,  // 전체 가능한 습관 체크 수 (습관 수 * 가족 구성원 수)
                    (int) completedCount,
                    logSummaries
            ));
        }

        return new com.habittracker.dto.MonthlyStatsResponse(
                year,
                month,
                new java.util.ArrayList<>(userStatsMap.values()),
                new java.util.ArrayList<>(habitStatsMap.values()),
                dailyStatsMap
        );
    }
}

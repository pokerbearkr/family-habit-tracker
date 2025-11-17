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

    // Calculate how many target days a habit has in a given month
    private int calculateTargetDaysForHabit(Habit habit, int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        int daysInMonth = startDate.lengthOfMonth();

        // If it's a DAILY habit, target is all days in the month
        if ("DAILY".equals(habit.getHabitType()) || habit.getHabitType() == null) {
            return daysInMonth;
        }

        // If it's a WEEKLY habit, count matching days
        if ("WEEKLY".equals(habit.getHabitType()) && habit.getSelectedDays() != null) {
            String[] selectedDaysStr = habit.getSelectedDays().split(",");
            java.util.Set<Integer> selectedDays = new java.util.HashSet<>();
            for (String day : selectedDaysStr) {
                selectedDays.add(Integer.parseInt(day.trim()));
            }

            int count = 0;
            for (int day = 1; day <= daysInMonth; day++) {
                LocalDate date = LocalDate.of(year, month, day);
                int dayOfWeek = date.getDayOfWeek().getValue(); // 1=Mon, 7=Sun
                if (selectedDays.contains(dayOfWeek)) {
                    count++;
                }
            }
            return count;
        }

        // Default to all days if type is unknown
        return daysInMonth;
    }

    // Check if a habit should be done on a specific date
    private boolean isHabitForDate(Habit habit, LocalDate date) {
        if ("DAILY".equals(habit.getHabitType()) || habit.getHabitType() == null) {
            return true;
        }

        if ("WEEKLY".equals(habit.getHabitType()) && habit.getSelectedDays() != null) {
            String[] selectedDaysStr = habit.getSelectedDays().split(",");
            int dayOfWeek = date.getDayOfWeek().getValue(); // 1=Mon, 7=Sun

            for (String day : selectedDaysStr) {
                if (Integer.parseInt(day.trim()) == dayOfWeek) {
                    return true;
                }
            }
            return false;
        }

        return true; // Default to true if type is unknown
    }

    private com.habittracker.dto.MonthlyStatsResponse calculateMonthlyStats(
            int year, int month, List<HabitLog> logs, com.habittracker.entity.Family family) {

        int daysInMonth = LocalDate.of(year, month, 1).lengthOfMonth();

        // Calculate user stats
        java.util.Map<Long, com.habittracker.dto.MonthlyStatsResponse.UserStats> userStatsMap = new java.util.HashMap<>();
        family.getMembers().forEach(user -> {
            // Get all habits for this user
            java.util.List<Habit> userHabits = family.getHabits().stream()
                    .filter(habit -> habit.getUser().getId().equals(user.getId()))
                    .toList();

            // Calculate total possible days for all user's habits
            int totalPossible = userHabits.stream()
                    .mapToInt(habit -> calculateTargetDaysForHabit(habit, year, month))
                    .sum();

            // Count completed logs for this user's habits
            long completedCount = logs.stream()
                    .filter(log -> log.getUser().getId().equals(user.getId()) && log.getCompleted())
                    .count();

            userStatsMap.put(user.getId(), new com.habittracker.dto.MonthlyStatsResponse.UserStats(
                    user.getId(),
                    user.getUsername(),
                    user.getDisplayName(),
                    userHabits.size(),
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

            // Calculate target days based on habit type
            int totalPossible = calculateTargetDaysForHabit(habit, year, month);

            habitStatsMap.put(habit.getId(), new com.habittracker.dto.MonthlyStatsResponse.HabitStats(
                    habit.getId(),
                    habit.getName(),
                    habit.getColor(),
                    habit.getUser().getId(),
                    habit.getUser().getDisplayName(),
                    (int) completedCount,
                    totalPossible,
                    totalPossible > 0 ? (completedCount * 100.0 / totalPossible) : 0
            ));
        });

        // Calculate daily stats
        java.util.Map<String, com.habittracker.dto.MonthlyStatsResponse.DayStats> dailyStatsMap = new java.util.HashMap<>();

        for (int day = 1; day <= daysInMonth; day++) {
            LocalDate date = LocalDate.of(year, month, day);
            String dateKey = date.toString();

            // Count habits that should be done on this specific day
            long totalPossiblePerDay = family.getHabits().stream()
                    .filter(habit -> isHabitForDate(habit, date))
                    .count();

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
                    (int) totalPossiblePerDay,
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

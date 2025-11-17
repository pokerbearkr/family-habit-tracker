package com.habittracker.service;

import com.habittracker.entity.Habit;
import com.habittracker.entity.HabitLog;
import com.habittracker.entity.User;
import com.habittracker.repository.HabitRepository;
import com.habittracker.repository.HabitLogRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HabitReminderScheduler {

    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;
    private final PushNotificationService pushNotificationService;

    public HabitReminderScheduler(
            HabitRepository habitRepository,
            HabitLogRepository habitLogRepository,
            PushNotificationService pushNotificationService
    ) {
        this.habitRepository = habitRepository;
        this.habitLogRepository = habitLogRepository;
        this.pushNotificationService = pushNotificationService;
    }

    // 매일 오후 9시에 실행 (cron: 초 분 시 일 월 요일)
    // 0 0 21 * * * = 매일 21시 0분 0초
    @Scheduled(cron = "0 0 21 * * *", zone = "Asia/Seoul")
    public void sendDailyReminders() {
        System.out.println("=== 오후 9시 습관 알림 스케줄러 실행 ===");

        LocalDate today = LocalDate.now();

        // 모든 습관 가져오기
        List<Habit> allHabits = habitRepository.findAll();

        // 사용자별로 그룹화하여 처리
        allHabits.stream()
                .collect(Collectors.groupingBy(Habit::getUser))
                .forEach((user, userHabits) -> {
                    // 알림 설정이 꺼져 있으면 스킵
                    if (user.getEnableReminders() == null || !user.getEnableReminders()) {
                        System.out.println(String.format("알림 스킵: %s (알림 설정 꺼짐)", user.getDisplayName()));
                        return;
                    }

                    // 오늘 해야 하는 습관 필터링
                    List<Habit> todayHabits = userHabits.stream()
                            .filter(habit -> isHabitForToday(habit, today))
                            .collect(Collectors.toList());

                    if (todayHabits.isEmpty()) {
                        return;
                    }

                    // 미완료 습관 찾기
                    List<Habit> incompleteHabits = todayHabits.stream()
                            .filter(habit -> !isHabitCompleted(habit, user, today))
                            .collect(Collectors.toList());

                    // 미완료 습관이 있으면 알림 전송
                    if (!incompleteHabits.isEmpty()) {
                        sendReminderNotification(user, incompleteHabits);
                    }
                });

        System.out.println("=== 습관 알림 전송 완료 ===");
    }

    private boolean isHabitForToday(Habit habit, LocalDate date) {
        if ("DAILY".equals(habit.getHabitType()) || habit.getHabitType() == null) {
            return true;
        }

        if ("WEEKLY".equals(habit.getHabitType()) && habit.getSelectedDays() != null) {
            int dayOfWeek = date.getDayOfWeek().getValue(); // 1=Mon, 7=Sun
            String[] selectedDaysStr = habit.getSelectedDays().split(",");

            for (String day : selectedDaysStr) {
                if (Integer.parseInt(day.trim()) == dayOfWeek) {
                    return true;
                }
            }
            return false;
        }

        return true;
    }

    private boolean isHabitCompleted(Habit habit, User user, LocalDate date) {
        return habitLogRepository.findByHabitAndUserAndDate(habit, user, date)
                .map(HabitLog::getCompleted)
                .orElse(false);
    }

    private void sendReminderNotification(User user, List<Habit> incompleteHabits) {
        String habitNames = incompleteHabits.stream()
                .map(Habit::getName)
                .limit(3) // 최대 3개까지만 표시
                .collect(Collectors.joining(", "));

        String body;
        if (incompleteHabits.size() > 3) {
            body = String.format("%s 외 %d개의 습관이 아직 완료되지 않았습니다!",
                    habitNames, incompleteHabits.size() - 3);
        } else {
            body = String.format("%s 습관을 완료해주세요!", habitNames);
        }

        pushNotificationService.sendNotification(
                user,
                "🔔 습관 알림",
                body
        );

        System.out.println(String.format("알림 전송: %s - %s", user.getDisplayName(), body));
    }
}

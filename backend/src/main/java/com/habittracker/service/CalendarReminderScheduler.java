package com.habittracker.service;

import com.habittracker.entity.CalendarEvent;
import com.habittracker.entity.User;
import com.habittracker.repository.CalendarEventRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CalendarReminderScheduler {

    private final CalendarEventRepository calendarEventRepository;
    private final PushNotificationService pushNotificationService;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    public CalendarReminderScheduler(
            CalendarEventRepository calendarEventRepository,
            PushNotificationService pushNotificationService
    ) {
        this.calendarEventRepository = calendarEventRepository;
        this.pushNotificationService = pushNotificationService;
    }

    // 매분 실행하여 알림 시간이 된 일정 체크
    @Transactional(readOnly = true)
    @Scheduled(cron = "0 * * * * *", zone = "Asia/Seoul")
    public void sendCalendarReminders() {
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Seoul"));

        System.out.println(String.format("=== %s 캘린더 알림 스케줄러 실행 ===", now.format(TIME_FORMATTER)));

        // 향후 2시간 이내에 시작하는 일정 중 알림이 설정된 것들을 조회
        LocalDateTime checkStart = now;
        LocalDateTime checkEnd = now.plusHours(2);

        List<CalendarEvent> upcomingEvents = calendarEventRepository.findEventsNeedingReminder(checkStart, checkEnd);

        for (CalendarEvent event : upcomingEvents) {
            Integer reminderMinutes = event.getReminderMinutes();
            if (reminderMinutes == null) {
                continue;
            }

            // 알림을 보내야 하는 시간 계산
            LocalDateTime reminderTime = event.getStartDatetime().minusMinutes(reminderMinutes);

            // 현재 시간이 알림 시간인지 체크 (분 단위로)
            if (isTimeToRemind(now, reminderTime)) {
                sendEventReminder(event);
            }
        }
    }

    private boolean isTimeToRemind(LocalDateTime now, LocalDateTime reminderTime) {
        // 현재 시간과 알림 시간이 같은 분인지 체크
        return now.getYear() == reminderTime.getYear() &&
               now.getMonthValue() == reminderTime.getMonthValue() &&
               now.getDayOfMonth() == reminderTime.getDayOfMonth() &&
               now.getHour() == reminderTime.getHour() &&
               now.getMinute() == reminderTime.getMinute();
    }

    private void sendEventReminder(CalendarEvent event) {
        // 가족 구성원 모두에게 알림 전송
        Set<User> familyMembers = event.getFamily().getMembers();

        String title = "📅 일정 알림";
        String body = buildReminderBody(event);

        for (User member : familyMembers) {
            // 알림 설정이 활성화된 사용자에게만 전송
            if (member.getEnableReminders() != null && member.getEnableReminders()) {
                pushNotificationService.sendNotification(member, title, body);
                System.out.println(String.format("캘린더 알림 전송: %s - %s", member.getDisplayName(), event.getTitle()));
            }
        }
    }

    private String buildReminderBody(CalendarEvent event) {
        Integer reminderMinutes = event.getReminderMinutes();
        String timeInfo;

        if (reminderMinutes == 0) {
            timeInfo = "지금";
        } else if (reminderMinutes < 60) {
            timeInfo = String.format("%d분 후", reminderMinutes);
        } else {
            int hours = reminderMinutes / 60;
            int mins = reminderMinutes % 60;
            if (mins == 0) {
                timeInfo = String.format("%d시간 후", hours);
            } else {
                timeInfo = String.format("%d시간 %d분 후", hours, mins);
            }
        }

        String eventTime = event.getStartDatetime().format(TIME_FORMATTER);

        if (event.getAllDay()) {
            return String.format("'%s' 일정이 %s 시작됩니다", event.getTitle(), timeInfo);
        } else {
            return String.format("'%s' 일정이 %s (%s) 시작됩니다", event.getTitle(), timeInfo, eventTime);
        }
    }
}

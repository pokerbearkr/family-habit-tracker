package com.habittracker.service;

import com.habittracker.dto.CalendarEventRequest;
import com.habittracker.dto.CalendarEventResponse;
import com.habittracker.dto.CalendarEventUpdateMessage;
import com.habittracker.entity.CalendarEvent;
import com.habittracker.entity.Family;
import com.habittracker.entity.User;
import com.habittracker.repository.CalendarEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarEventRepository calendarEventRepository;
    private final AuthService authService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public CalendarEventResponse createEvent(CalendarEventRequest request) {
        User currentUser = authService.getCurrentUser();
        Family family = currentUser.getFamily();

        if (family == null) {
            throw new RuntimeException("가족에 속해있어야 일정을 생성할 수 있습니다");
        }

        CalendarEvent event = CalendarEvent.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .startDatetime(request.getStartDatetime())
                .endDatetime(request.getEndDatetime())
                .allDay(request.getAllDay() != null ? request.getAllDay() : false)
                .color(request.getColor() != null ? request.getColor() : "#3843FF")
                .repeatType(CalendarEvent.RepeatType.valueOf(request.getRepeatType() != null ? request.getRepeatType() : "NONE"))
                .repeatEndDate(request.getRepeatEndDate())
                .reminderMinutes(request.getReminderMinutes())
                .family(family)
                .createdBy(currentUser)
                .build();

        CalendarEvent savedEvent = calendarEventRepository.save(event);
        CalendarEventResponse response = CalendarEventResponse.from(savedEvent);

        // WebSocket broadcast
        sendEventUpdate("CREATED", response, null, family.getId());

        return response;
    }

    @Transactional(readOnly = true)
    public List<CalendarEventResponse> getEvents(LocalDate startDate, LocalDate endDate) {
        User currentUser = authService.getCurrentUser();
        Family family = currentUser.getFamily();

        if (family == null) {
            throw new RuntimeException("가족에 속해있어야 일정을 조회할 수 있습니다");
        }

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<CalendarEvent> events = calendarEventRepository.findByFamilyAndDateRange(family, start, end);

        // Expand recurring events
        List<CalendarEventResponse> result = new ArrayList<>();
        for (CalendarEvent event : events) {
            result.addAll(expandRecurringEvent(event, startDate, endDate));
        }

        return result;
    }

    @Transactional
    public CalendarEventResponse updateEvent(Long eventId, CalendarEventRequest request) {
        User currentUser = authService.getCurrentUser();
        CalendarEvent event = calendarEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("일정을 찾을 수 없습니다"));

        // Check if user belongs to the same family
        if (!currentUser.getFamily().getId().equals(event.getFamily().getId())) {
            throw new RuntimeException("이 일정을 수정할 권한이 없습니다");
        }

        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setStartDatetime(request.getStartDatetime());
        event.setEndDatetime(request.getEndDatetime());
        event.setAllDay(request.getAllDay() != null ? request.getAllDay() : false);
        event.setColor(request.getColor() != null ? request.getColor() : "#3843FF");
        event.setRepeatType(CalendarEvent.RepeatType.valueOf(request.getRepeatType() != null ? request.getRepeatType() : "NONE"));
        event.setRepeatEndDate(request.getRepeatEndDate());
        event.setReminderMinutes(request.getReminderMinutes());

        CalendarEvent updatedEvent = calendarEventRepository.save(event);
        CalendarEventResponse response = CalendarEventResponse.from(updatedEvent);

        // WebSocket broadcast
        sendEventUpdate("UPDATED", response, null, event.getFamily().getId());

        return response;
    }

    @Transactional
    public void deleteEvent(Long eventId) {
        User currentUser = authService.getCurrentUser();
        CalendarEvent event = calendarEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("일정을 찾을 수 없습니다"));

        // Check if user belongs to the same family
        if (!currentUser.getFamily().getId().equals(event.getFamily().getId())) {
            throw new RuntimeException("이 일정을 삭제할 권한이 없습니다");
        }

        Long familyId = event.getFamily().getId();
        calendarEventRepository.delete(event);

        // WebSocket broadcast
        sendEventUpdate("DELETED", null, eventId, familyId);
    }

    private void sendEventUpdate(String type, CalendarEventResponse event, Long deletedEventId, Long familyId) {
        CalendarEventUpdateMessage message = new CalendarEventUpdateMessage(type, event, deletedEventId);
        messagingTemplate.convertAndSend("/topic/family/" + familyId + "/calendar-updates", message);
    }

    /**
     * Expand recurring events into individual instances within the date range
     */
    private List<CalendarEventResponse> expandRecurringEvent(CalendarEvent event, LocalDate rangeStart, LocalDate rangeEnd) {
        List<CalendarEventResponse> expandedEvents = new ArrayList<>();

        if (event.getRepeatType() == CalendarEvent.RepeatType.NONE) {
            expandedEvents.add(CalendarEventResponse.from(event));
            return expandedEvents;
        }

        LocalDate eventDate = event.getStartDatetime().toLocalDate();
        LocalDate repeatEnd = event.getRepeatEndDate() != null ? event.getRepeatEndDate() : rangeEnd;

        // Don't expand beyond the range
        if (repeatEnd.isAfter(rangeEnd)) {
            repeatEnd = rangeEnd;
        }

        LocalTime startTime = event.getStartDatetime().toLocalTime();
        LocalTime endTime = event.getEndDatetime().toLocalTime();
        long durationMinutes = java.time.Duration.between(event.getStartDatetime(), event.getEndDatetime()).toMinutes();

        LocalDate currentDate = eventDate;
        while (!currentDate.isAfter(repeatEnd)) {
            if (!currentDate.isBefore(rangeStart)) {
                CalendarEventResponse instanceResponse = new CalendarEventResponse(
                        event.getId(),
                        event.getTitle(),
                        event.getDescription(),
                        currentDate.atTime(startTime),
                        currentDate.atTime(startTime).plusMinutes(durationMinutes),
                        event.getAllDay(),
                        event.getColor(),
                        event.getRepeatType().name(),
                        event.getRepeatEndDate(),
                        event.getReminderMinutes(),
                        event.getFamily().getId(),
                        event.getCreatedBy().getId(),
                        event.getCreatedBy().getUsername(),
                        event.getCreatedBy().getDisplayName(),
                        event.getCreatedAt(),
                        event.getUpdatedAt()
                );
                expandedEvents.add(instanceResponse);
            }

            // Move to next occurrence
            currentDate = switch (event.getRepeatType()) {
                case DAILY -> currentDate.plusDays(1);
                case WEEKLY -> currentDate.plusWeeks(1);
                case MONTHLY -> currentDate.plusMonths(1);
                case YEARLY -> currentDate.plusYears(1);
                default -> repeatEnd.plusDays(1); // Exit loop
            };
        }

        return expandedEvents;
    }

    /**
     * Get events that need reminder notification
     */
    @Transactional(readOnly = true)
    public List<CalendarEvent> getEventsNeedingReminder(LocalDateTime start, LocalDateTime end) {
        return calendarEventRepository.findEventsNeedingReminder(start, end);
    }
}

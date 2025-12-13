package com.habittracker.dto;

import com.habittracker.entity.CalendarEvent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventResponse {

    private Long id;
    private String title;
    private String description;
    private LocalDateTime startDatetime;
    private LocalDateTime endDatetime;
    private Boolean allDay;
    private String color;
    private String repeatType;
    private LocalDate repeatEndDate;
    private Integer reminderMinutes;
    private Long familyId;
    private Long createdById;
    private String createdByName;
    private String createdByDisplayName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CalendarEventResponse from(CalendarEvent event) {
        return new CalendarEventResponse(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getStartDatetime(),
                event.getEndDatetime(),
                event.getAllDay(),
                event.getColor(),
                event.getRepeatType().name(),
                event.getRepeatEndDate(),
                event.getReminderMinutes(),
                event.getFamily() != null ? event.getFamily().getId() : null,
                event.getCreatedBy() != null ? event.getCreatedBy().getId() : null,
                event.getCreatedBy() != null ? event.getCreatedBy().getUsername() : null,
                event.getCreatedBy() != null ? event.getCreatedBy().getDisplayName() : null,
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }
}

package com.habittracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventRequest {

    @NotBlank(message = "제목은 필수입니다")
    private String title;

    private String description;

    @NotNull(message = "시작 일시는 필수입니다")
    private LocalDateTime startDatetime;

    @NotNull(message = "종료 일시는 필수입니다")
    private LocalDateTime endDatetime;

    private Boolean allDay = false;

    private String color = "#3843FF";

    private String repeatType = "NONE"; // NONE, DAILY, WEEKLY, MONTHLY, YEARLY

    private LocalDate repeatEndDate;

    private Integer reminderMinutes; // null = no reminder
}

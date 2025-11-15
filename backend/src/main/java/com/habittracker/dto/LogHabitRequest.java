package com.habittracker.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LogHabitRequest {

    @NotNull(message = "Habit ID is required")
    private Long habitId;

    @NotNull(message = "Log date is required")
    private LocalDate logDate;

    @NotNull(message = "Completed status is required")
    private Boolean completed;

    private String note;
}

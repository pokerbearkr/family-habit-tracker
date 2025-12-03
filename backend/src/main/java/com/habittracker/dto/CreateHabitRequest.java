package com.habittracker.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateHabitRequest {

    @NotBlank(message = "Habit name is required")
    private String name;

    private String description;

    @NotBlank(message = "Color is required")
    private String color;

    private String icon; // Emoji icon for the habit

    private String habitType; // DAILY, WEEKLY, or WEEKLY_COUNT (defaults to DAILY if not provided)

    private String selectedDays; // Comma-separated day numbers for WEEKLY habits

    private Integer weeklyTarget; // Target count per week for WEEKLY_COUNT habits
}

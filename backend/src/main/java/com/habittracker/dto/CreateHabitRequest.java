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

    private String habitType; // DAILY or WEEKLY (defaults to DAILY if not provided)

    private String selectedDays; // Comma-separated day numbers for WEEKLY habits
}

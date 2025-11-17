package com.habittracker.dto;

import com.habittracker.entity.Habit;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HabitResponse {
    private Long id;
    private String name;
    private String description;
    private String color;
    private Long familyId;
    private Long userId;
    private String userName;
    private String userDisplayName;
    private Integer displayOrder;
    private String habitType;
    private String selectedDays;

    public static HabitResponse from(Habit habit) {
        return new HabitResponse(
            habit.getId(),
            habit.getName(),
            habit.getDescription(),
            habit.getColor(),
            habit.getFamily() != null ? habit.getFamily().getId() : null,
            habit.getUser() != null ? habit.getUser().getId() : null,
            habit.getUser() != null ? habit.getUser().getUsername() : null,
            habit.getUser() != null ? habit.getUser().getDisplayName() : null,
            habit.getDisplayOrder(),
            habit.getHabitType(),
            habit.getSelectedDays()
        );
    }
}

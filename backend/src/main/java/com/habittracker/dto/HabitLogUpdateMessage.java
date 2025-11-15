package com.habittracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HabitLogUpdateMessage {
    private Long habitLogId;
    private Long habitId;
    private String habitName;
    private Long userId;
    private String userName;
    private LocalDate logDate;
    private Boolean completed;
    private String note;
    private Long familyId;
}

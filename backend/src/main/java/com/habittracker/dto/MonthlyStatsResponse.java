package com.habittracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyStatsResponse {
    private int year;
    private int month;
    private List<UserStats> userStats;
    private List<HabitStats> habitStats;
    private Map<String, DayStats> dailyStats; // key: "YYYY-MM-DD"

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserStats {
        private Long userId;
        private String username;
        private String displayName;
        private int totalHabits;
        private int completedCount;
        private int totalPossible;
        private double completionRate; // percentage
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HabitStats {
        private Long habitId;
        private String habitName;
        private String color;
        private int completedCount;
        private int totalPossible;
        private double completionRate; // percentage
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayStats {
        private LocalDate date;
        private int totalHabits;
        private int completedCount;
        private List<HabitLogSummary> logs;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HabitLogSummary {
        private Long habitId;
        private String habitName;
        private Long userId;
        private String userName;
        private boolean completed;
    }
}

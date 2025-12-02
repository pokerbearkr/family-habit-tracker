package com.habittracker.dto;

import com.habittracker.entity.HabitLog;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HabitLogResponse {
    private Long id;
    private HabitSummary habit;
    private UserSummary user;
    private LocalDate logDate;
    private Boolean completed;
    private String note;
    private LocalDateTime completedAt;
    private List<CommentResponse> comments = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HabitSummary {
        private Long id;
        private String name;
        private String color;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String username;
        private String displayName;
    }

    public static HabitLogResponse from(HabitLog log) {
        HabitLogResponse response = new HabitLogResponse();
        response.setId(log.getId());
        response.setLogDate(log.getLogDate());
        response.setCompleted(log.getCompleted());
        response.setNote(log.getNote());
        response.setCompletedAt(log.getCompletedAt());

        if (log.getHabit() != null) {
            response.setHabit(new HabitSummary(
                log.getHabit().getId(),
                log.getHabit().getName(),
                log.getHabit().getColor()
            ));
        }

        if (log.getUser() != null) {
            response.setUser(new UserSummary(
                log.getUser().getId(),
                log.getUser().getUsername(),
                log.getUser().getDisplayName()
            ));
        }

        return response;
    }
}

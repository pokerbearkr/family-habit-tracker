package com.habittracker.controller;

import com.habittracker.dto.CommentResponse;
import com.habittracker.dto.HabitLogResponse;
import com.habittracker.dto.LogHabitRequest;
import com.habittracker.entity.Comment;
import com.habittracker.entity.HabitLog;
import com.habittracker.repository.CommentRepository;
import com.habittracker.service.HabitLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class HabitLogController {

    private final HabitLogService habitLogService;
    private final CommentRepository commentRepository;

    @PostMapping
    public ResponseEntity<HabitLogResponse> logHabit(@Valid @RequestBody LogHabitRequest request) {
        HabitLog habitLog = habitLogService.logHabit(request);
        return ResponseEntity.ok(HabitLogResponse.from(habitLog));
    }

    @GetMapping("/family/{date}")
    public ResponseEntity<List<HabitLogResponse>> getFamilyLogsForDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<HabitLog> logs = habitLogService.getFamilyLogsForDate(date);
        List<HabitLogResponse> responses = logs.stream()
                .map(HabitLogResponse::from)
                .collect(Collectors.toList());

        // Fetch comments for all logs
        List<Long> logIds = logs.stream().map(HabitLog::getId).collect(Collectors.toList());
        if (!logIds.isEmpty()) {
            Map<Long, List<CommentResponse>> commentsMap = commentRepository.findByHabitLogIdsWithUser(logIds)
                    .stream()
                    .map(CommentResponse::from)
                    .collect(Collectors.groupingBy(CommentResponse::getHabitLogId));

            responses.forEach(response -> {
                response.setComments(commentsMap.getOrDefault(response.getId(), new java.util.ArrayList<>()));
            });
        }

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/family/range")
    public ResponseEntity<List<HabitLogResponse>> getFamilyLogsForDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<HabitLog> logs = habitLogService.getFamilyLogsForDateRange(startDate, endDate);
        List<HabitLogResponse> responses = logs.stream()
                .map(HabitLogResponse::from)
                .collect(Collectors.toList());

        // Fetch comments for all logs
        List<Long> logIds = logs.stream().map(HabitLog::getId).collect(Collectors.toList());
        if (!logIds.isEmpty()) {
            Map<Long, List<CommentResponse>> commentsMap = commentRepository.findByHabitLogIdsWithUser(logIds)
                    .stream()
                    .map(CommentResponse::from)
                    .collect(Collectors.groupingBy(CommentResponse::getHabitLogId));

            responses.forEach(response -> {
                response.setComments(commentsMap.getOrDefault(response.getId(), new java.util.ArrayList<>()));
            });
        }

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/my/{date}")
    public ResponseEntity<List<HabitLogResponse>> getMyLogsForDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<HabitLog> logs = habitLogService.getMyLogsForDate(date);
        return ResponseEntity.ok(
            logs.stream()
                .map(HabitLogResponse::from)
                .collect(Collectors.toList())
        );
    }

    @GetMapping("/monthly")
    public ResponseEntity<com.habittracker.dto.MonthlyStatsResponse> getMonthlyStats(
            @RequestParam int year,
            @RequestParam int month) {
        com.habittracker.dto.MonthlyStatsResponse stats = habitLogService.getMonthlyStats(year, month);
        return ResponseEntity.ok(stats);
    }
}

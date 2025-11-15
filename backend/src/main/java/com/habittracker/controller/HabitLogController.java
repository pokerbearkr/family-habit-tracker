package com.habittracker.controller;

import com.habittracker.dto.HabitLogResponse;
import com.habittracker.dto.LogHabitRequest;
import com.habittracker.entity.HabitLog;
import com.habittracker.service.HabitLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class HabitLogController {

    private final HabitLogService habitLogService;

    @PostMapping
    public ResponseEntity<HabitLogResponse> logHabit(@Valid @RequestBody LogHabitRequest request) {
        HabitLog habitLog = habitLogService.logHabit(request);
        return ResponseEntity.ok(HabitLogResponse.from(habitLog));
    }

    @GetMapping("/family/{date}")
    public ResponseEntity<List<HabitLogResponse>> getFamilyLogsForDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<HabitLog> logs = habitLogService.getFamilyLogsForDate(date);
        return ResponseEntity.ok(
            logs.stream()
                .map(HabitLogResponse::from)
                .collect(Collectors.toList())
        );
    }

    @GetMapping("/family/range")
    public ResponseEntity<List<HabitLogResponse>> getFamilyLogsForDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<HabitLog> logs = habitLogService.getFamilyLogsForDateRange(startDate, endDate);
        return ResponseEntity.ok(
            logs.stream()
                .map(HabitLogResponse::from)
                .collect(Collectors.toList())
        );
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

package com.habittracker.controller;

import com.habittracker.dto.CreateHabitRequest;
import com.habittracker.dto.HabitResponse;
import com.habittracker.entity.Habit;
import com.habittracker.service.HabitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
public class HabitController {

    private final HabitService habitService;

    @PostMapping
    public ResponseEntity<HabitResponse> createHabit(@Valid @RequestBody CreateHabitRequest request) {
        Habit habit = habitService.createHabit(request);
        return ResponseEntity.ok(HabitResponse.from(habit));
    }

    @GetMapping
    public ResponseEntity<List<HabitResponse>> getFamilyHabits() {
        List<Habit> habits = habitService.getFamilyHabits();
        return ResponseEntity.ok(
            habits.stream()
                .map(HabitResponse::from)
                .collect(Collectors.toList())
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<HabitResponse> updateHabit(
            @PathVariable Long id,
            @Valid @RequestBody CreateHabitRequest request) {
        Habit habit = habitService.updateHabit(id, request);
        return ResponseEntity.ok(HabitResponse.from(habit));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteHabit(@PathVariable Long id) {
        habitService.deleteHabit(id);
        return ResponseEntity.ok("Habit deleted successfully");
    }
}

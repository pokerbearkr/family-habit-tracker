package com.habittracker.service;

import com.habittracker.dto.CreateHabitRequest;
import com.habittracker.entity.Family;
import com.habittracker.entity.Habit;
import com.habittracker.entity.User;
import com.habittracker.repository.HabitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final AuthService authService;

    @Transactional
    public Habit createHabit(CreateHabitRequest request) {
        User currentUser = authService.getCurrentUser();

        if (currentUser.getFamily() == null) {
            throw new RuntimeException("User must belong to a family to create habits");
        }

        Habit habit = Habit.builder()
                .name(request.getName())
                .description(request.getDescription())
                .color(request.getColor())
                .user(currentUser)
                .family(currentUser.getFamily())
                .build();

        return habitRepository.save(habit);
    }

    @Transactional(readOnly = true)
    public List<Habit> getFamilyHabits() {
        User currentUser = authService.getCurrentUser();

        if (currentUser.getFamily() == null) {
            throw new RuntimeException("User must belong to a family to view habits");
        }

        return habitRepository.findByFamilyId(currentUser.getFamily().getId());
    }

    @Transactional
    public Habit updateHabit(Long habitId, CreateHabitRequest request) {
        User currentUser = authService.getCurrentUser();
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new RuntimeException("Habit not found"));

        // Check if user is the owner of this habit
        if (!currentUser.getId().equals(habit.getUser().getId())) {
            throw new RuntimeException("Unauthorized to update this habit - only the owner can modify it");
        }

        habit.setName(request.getName());
        habit.setDescription(request.getDescription());
        habit.setColor(request.getColor());

        return habitRepository.save(habit);
    }

    @Transactional
    public void deleteHabit(Long habitId) {
        User currentUser = authService.getCurrentUser();
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new RuntimeException("Habit not found"));

        // Check if user is the owner of this habit
        if (!currentUser.getId().equals(habit.getUser().getId())) {
            throw new RuntimeException("Unauthorized to delete this habit - only the owner can delete it");
        }

        habitRepository.delete(habit);
    }
}

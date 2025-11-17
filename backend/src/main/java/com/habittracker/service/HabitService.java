package com.habittracker.service;

import com.habittracker.dto.CreateHabitRequest;
import com.habittracker.dto.HabitReorderRequest;
import com.habittracker.entity.Family;
import com.habittracker.entity.Habit;
import com.habittracker.entity.User;
import com.habittracker.repository.HabitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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

        // Get the maximum display order for user's habits
        Integer maxOrder = habitRepository.findMaxDisplayOrderByUserId(currentUser.getId());
        int newOrder = (maxOrder == null) ? 0 : maxOrder + 1;

        // Set default habitType if not provided
        String habitType = request.getHabitType() != null ? request.getHabitType() : "DAILY";

        Habit habit = Habit.builder()
                .name(request.getName())
                .description(request.getDescription())
                .color(request.getColor())
                .user(currentUser)
                .family(currentUser.getFamily())
                .displayOrder(newOrder)
                .habitType(habitType)
                .selectedDays(request.getSelectedDays())
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

        // Update habitType and selectedDays if provided
        if (request.getHabitType() != null) {
            habit.setHabitType(request.getHabitType());
        }
        habit.setSelectedDays(request.getSelectedDays());

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

    @Transactional
    public void reorderHabit(Long habitId, String direction) {
        User currentUser = authService.getCurrentUser();
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new RuntimeException("Habit not found"));

        // Check if user is the owner of this habit
        if (!currentUser.getId().equals(habit.getUser().getId())) {
            throw new RuntimeException("Unauthorized to reorder this habit");
        }

        // Get all user's habits ordered by displayOrder
        List<Habit> userHabits = habitRepository.findByUserIdOrderByDisplayOrderAsc(currentUser.getId());

        int currentIndex = -1;
        for (int i = 0; i < userHabits.size(); i++) {
            if (userHabits.get(i).getId().equals(habitId)) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex == -1) {
            throw new RuntimeException("Habit not found in user's habits");
        }

        // Swap with adjacent habit
        if ("up".equals(direction) && currentIndex > 0) {
            Habit previousHabit = userHabits.get(currentIndex - 1);
            int tempOrder = habit.getDisplayOrder();
            habit.setDisplayOrder(previousHabit.getDisplayOrder());
            previousHabit.setDisplayOrder(tempOrder);
            habitRepository.save(habit);
            habitRepository.save(previousHabit);
        } else if ("down".equals(direction) && currentIndex < userHabits.size() - 1) {
            Habit nextHabit = userHabits.get(currentIndex + 1);
            int tempOrder = habit.getDisplayOrder();
            habit.setDisplayOrder(nextHabit.getDisplayOrder());
            nextHabit.setDisplayOrder(tempOrder);
            habitRepository.save(habit);
            habitRepository.save(nextHabit);
        }
    }

    @Transactional
    public void reorderHabitsBatch(List<HabitReorderRequest> updates) {
        User currentUser = authService.getCurrentUser();

        if (updates == null || updates.isEmpty()) {
            return;
        }

        // Get all habit IDs from the request
        Set<Long> habitIds = updates.stream()
                .map(HabitReorderRequest::getId)
                .collect(Collectors.toSet());

        // Fetch all habits in one query
        List<Habit> habitsToUpdate = habitRepository.findAllById(habitIds);

        // Verify user owns all habits
        for (Habit habit : habitsToUpdate) {
            if (!currentUser.getId().equals(habit.getUser().getId())) {
                throw new RuntimeException("Unauthorized to reorder habits - you don't own all the habits");
            }
        }

        // Update display orders
        for (HabitReorderRequest update : updates) {
            habitsToUpdate.stream()
                    .filter(habit -> habit.getId().equals(update.getId()))
                    .findFirst()
                    .ifPresent(habit -> habit.setDisplayOrder(update.getDisplayOrder()));
        }

        // Save all habits
        habitRepository.saveAll(habitsToUpdate);
    }
}

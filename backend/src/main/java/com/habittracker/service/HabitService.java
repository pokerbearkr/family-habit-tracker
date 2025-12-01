package com.habittracker.service;

import com.habittracker.dto.CreateHabitRequest;
import com.habittracker.dto.HabitReorderRequest;
import com.habittracker.dto.HabitResponse;
import com.habittracker.entity.Family;
import com.habittracker.entity.Habit;
import com.habittracker.entity.HabitLog;
import com.habittracker.entity.User;
import com.habittracker.repository.HabitLogRepository;
import com.habittracker.repository.HabitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;
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
                .weeklyTarget(request.getWeeklyTarget())
                .build();

        return habitRepository.save(habit);
    }

    @Transactional(readOnly = true)
    public List<HabitResponse> getFamilyHabitsWithStreak() {
        User currentUser = authService.getCurrentUser();

        if (currentUser.getFamily() == null) {
            throw new RuntimeException("User must belong to a family to view habits");
        }

        List<Habit> habits = habitRepository.findByFamilyId(currentUser.getFamily().getId());

        return habits.stream()
                .map(habit -> HabitResponse.from(habit, calculateStreak(habit)))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Habit> getFamilyHabits() {
        User currentUser = authService.getCurrentUser();

        if (currentUser.getFamily() == null) {
            throw new RuntimeException("User must belong to a family to view habits");
        }

        return habitRepository.findByFamilyId(currentUser.getFamily().getId());
    }

    /**
     * Calculate streak for a habit based on habit type
     */
    private int calculateStreak(Habit habit) {
        List<HabitLog> completedLogs = habitLogRepository.findCompletedLogsByHabitIdOrderByLogDateDesc(habit.getId());

        if (completedLogs.isEmpty()) {
            return 0;
        }

        LocalDate today = LocalDate.now();
        String habitType = habit.getHabitType() != null ? habit.getHabitType() : "DAILY";

        if ("WEEKLY_COUNT".equals(habitType)) {
            // For WEEKLY_COUNT, calculate week-based streak
            return calculateWeeklyCountStreak(habit, completedLogs);
        } else if ("WEEKLY".equals(habitType)) {
            // For WEEKLY (specific days), calculate based on selected days
            return calculateWeeklyStreak(habit, completedLogs);
        } else {
            // For DAILY habits
            return calculateDailyStreak(completedLogs, today);
        }
    }

    private int calculateDailyStreak(List<HabitLog> completedLogs, LocalDate today) {
        Set<LocalDate> completedDates = completedLogs.stream()
                .map(HabitLog::getLogDate)
                .collect(Collectors.toSet());

        int streak = 0;
        LocalDate checkDate = today;

        // If today is not completed, start from yesterday
        if (!completedDates.contains(today)) {
            checkDate = today.minusDays(1);
        }

        // Count consecutive days
        while (completedDates.contains(checkDate)) {
            streak++;
            checkDate = checkDate.minusDays(1);
        }

        return streak;
    }

    private int calculateWeeklyStreak(Habit habit, List<HabitLog> completedLogs) {
        if (habit.getSelectedDays() == null || habit.getSelectedDays().isEmpty()) {
            return 0;
        }

        Set<Integer> selectedDays = new HashSet<>();
        for (String day : habit.getSelectedDays().split(",")) {
            selectedDays.add(Integer.parseInt(day.trim()));
        }

        Set<LocalDate> completedDates = completedLogs.stream()
                .map(HabitLog::getLogDate)
                .collect(Collectors.toSet());

        LocalDate today = LocalDate.now();
        int streak = 0;
        LocalDate checkDate = today;

        // Find the most recent scheduled day (today or before)
        while (!selectedDays.contains(checkDate.getDayOfWeek().getValue())) {
            checkDate = checkDate.minusDays(1);
            if (checkDate.isBefore(today.minusDays(7))) {
                return 0; // No scheduled day in the past week
            }
        }

        // If the most recent scheduled day is not completed, start from previous scheduled day
        if (!completedDates.contains(checkDate)) {
            checkDate = findPreviousScheduledDay(checkDate.minusDays(1), selectedDays);
        }

        // Count consecutive scheduled days that were completed
        while (checkDate != null && completedDates.contains(checkDate)) {
            streak++;
            checkDate = findPreviousScheduledDay(checkDate.minusDays(1), selectedDays);
            if (checkDate != null && checkDate.isBefore(today.minusDays(365))) {
                break; // Limit to 1 year
            }
        }

        return streak;
    }

    private LocalDate findPreviousScheduledDay(LocalDate from, Set<Integer> selectedDays) {
        LocalDate checkDate = from;
        for (int i = 0; i < 7; i++) {
            if (selectedDays.contains(checkDate.getDayOfWeek().getValue())) {
                return checkDate;
            }
            checkDate = checkDate.minusDays(1);
        }
        return null;
    }

    private int calculateWeeklyCountStreak(Habit habit, List<HabitLog> completedLogs) {
        if (habit.getWeeklyTarget() == null || habit.getWeeklyTarget() <= 0) {
            return 0;
        }

        int weeklyTarget = habit.getWeeklyTarget();
        LocalDate today = LocalDate.now();

        // Get week start (Monday)
        LocalDate currentWeekStart = today.minusDays(today.getDayOfWeek().getValue() - 1);

        int streak = 0;

        // Count completions for current week
        long currentWeekCount = completedLogs.stream()
                .filter(log -> !log.getLogDate().isBefore(currentWeekStart) && !log.getLogDate().isAfter(today))
                .count();

        // If current week target is met, count it
        if (currentWeekCount >= weeklyTarget) {
            streak++;
        }

        // Go back week by week
        LocalDate weekStart = currentWeekStart.minusDays(7);
        LocalDate weekEnd = currentWeekStart.minusDays(1);

        for (int i = 0; i < 52; i++) { // Max 1 year
            final LocalDate ws = weekStart;
            final LocalDate we = weekEnd;
            long weekCount = completedLogs.stream()
                    .filter(log -> !log.getLogDate().isBefore(ws) && !log.getLogDate().isAfter(we))
                    .count();

            if (weekCount >= weeklyTarget) {
                streak++;
                weekStart = weekStart.minusDays(7);
                weekEnd = weekEnd.minusDays(7);
            } else {
                break;
            }
        }

        return streak;
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
        habit.setWeeklyTarget(request.getWeeklyTarget());

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

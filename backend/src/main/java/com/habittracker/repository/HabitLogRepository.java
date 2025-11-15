package com.habittracker.repository;

import com.habittracker.entity.Habit;
import com.habittracker.entity.HabitLog;
import com.habittracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HabitLogRepository extends JpaRepository<HabitLog, Long> {
    Optional<HabitLog> findByUserAndHabitAndLogDate(User user, Habit habit, LocalDate logDate);

    List<HabitLog> findByUserAndLogDate(User user, LocalDate logDate);

    List<HabitLog> findByHabitAndLogDate(Habit habit, LocalDate logDate);

    @Query("SELECT hl FROM HabitLog hl WHERE hl.habit.family.id = :familyId AND hl.logDate = :logDate")
    List<HabitLog> findByFamilyIdAndLogDate(@Param("familyId") Long familyId, @Param("logDate") LocalDate logDate);

    @Query("SELECT hl FROM HabitLog hl WHERE hl.habit.family.id = :familyId AND hl.logDate BETWEEN :startDate AND :endDate")
    List<HabitLog> findByFamilyIdAndLogDateBetween(
        @Param("familyId") Long familyId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}

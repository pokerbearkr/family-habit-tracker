package com.habittracker.repository;

import com.habittracker.entity.Family;
import com.habittracker.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HabitRepository extends JpaRepository<Habit, Long> {
    List<Habit> findByFamily(Family family);
    List<Habit> findByFamilyId(Long familyId);
}

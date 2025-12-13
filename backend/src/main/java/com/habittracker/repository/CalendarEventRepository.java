package com.habittracker.repository;

import com.habittracker.entity.CalendarEvent;
import com.habittracker.entity.Family;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    List<CalendarEvent> findByFamilyOrderByStartDatetimeAsc(Family family);

    @Query("SELECT e FROM CalendarEvent e WHERE e.family = :family " +
           "AND ((e.startDatetime BETWEEN :start AND :end) " +
           "OR (e.endDatetime BETWEEN :start AND :end) " +
           "OR (e.startDatetime <= :start AND e.endDatetime >= :end))")
    List<CalendarEvent> findByFamilyAndDateRange(
            @Param("family") Family family,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT e FROM CalendarEvent e WHERE e.family = :family " +
           "AND e.reminderMinutes IS NOT NULL " +
           "AND e.startDatetime > :now " +
           "ORDER BY e.startDatetime ASC")
    List<CalendarEvent> findUpcomingEventsWithReminder(
            @Param("family") Family family,
            @Param("now") LocalDateTime now
    );

    // For reminder scheduler - find events needing reminder notification
    @Query("SELECT e FROM CalendarEvent e WHERE e.reminderMinutes IS NOT NULL " +
           "AND e.startDatetime BETWEEN :start AND :end")
    List<CalendarEvent> findEventsNeedingReminder(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
}

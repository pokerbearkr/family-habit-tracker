package com.habittracker.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "habits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Habit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // Owner of this habit

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @Column(nullable = false)
    private String color; // Hex color code for UI

    @Column(length = 10)
    private String icon; // Emoji icon for the habit

    @Column(name = "display_order")
    private Integer displayOrder; // Order for displaying habits

    @Column(name = "habit_type", nullable = false)
    @Builder.Default
    private String habitType = "DAILY"; // DAILY, WEEKLY, or WEEKLY_COUNT

    @Column(name = "selected_days")
    private String selectedDays; // Comma-separated day numbers (1=Mon, 7=Sun) for WEEKLY habits

    @Column(name = "weekly_target")
    private Integer weeklyTarget; // Target count per week for WEEKLY_COUNT habits

    @OneToMany(mappedBy = "habit", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<HabitLog> logs = new HashSet<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

package com.habittracker.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HabitReorderRequest {
    private Long id;
    private Integer displayOrder;
}

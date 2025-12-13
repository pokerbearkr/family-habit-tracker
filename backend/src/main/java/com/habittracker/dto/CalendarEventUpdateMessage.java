package com.habittracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventUpdateMessage {
    private String type; // CREATED, UPDATED, DELETED
    private CalendarEventResponse event;
    private Long deletedEventId; // Only used when type is DELETED
}

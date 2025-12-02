package com.habittracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CommentRequest {
    @NotNull(message = "Habit log ID is required")
    private Long habitLogId;

    @NotBlank(message = "Content is required")
    @Size(max = 500, message = "Content must be less than 500 characters")
    private String content;
}

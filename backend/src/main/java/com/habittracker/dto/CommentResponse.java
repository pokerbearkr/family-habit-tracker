package com.habittracker.dto;

import com.habittracker.entity.Comment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private Long id;
    private Long habitLogId;
    private Long userId;
    private String userName;
    private String userDisplayName;
    private String content;
    private LocalDateTime createdAt;

    public static CommentResponse from(Comment comment) {
        return new CommentResponse(
            comment.getId(),
            comment.getHabitLog().getId(),
            comment.getUser().getId(),
            comment.getUser().getUsername(),
            comment.getUser().getDisplayName(),
            comment.getContent(),
            comment.getCreatedAt()
        );
    }
}

package com.habittracker.controller;

import com.habittracker.dto.CommentRequest;
import com.habittracker.dto.CommentResponse;
import com.habittracker.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(@Valid @RequestBody CommentRequest request) {
        CommentResponse comment = commentService.createComment(request);
        return ResponseEntity.ok(comment);
    }

    @GetMapping("/habit-log/{habitLogId}")
    public ResponseEntity<List<CommentResponse>> getCommentsByHabitLogId(@PathVariable Long habitLogId) {
        List<CommentResponse> comments = commentService.getCommentsByHabitLogId(habitLogId);
        return ResponseEntity.ok(comments);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return ResponseEntity.ok("Comment deleted successfully");
    }
}

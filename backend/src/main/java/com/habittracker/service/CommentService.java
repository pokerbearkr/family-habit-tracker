package com.habittracker.service;

import com.habittracker.dto.CommentRequest;
import com.habittracker.dto.CommentResponse;
import com.habittracker.entity.Comment;
import com.habittracker.entity.HabitLog;
import com.habittracker.entity.User;
import com.habittracker.repository.CommentRepository;
import com.habittracker.repository.HabitLogRepository;
import com.habittracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final HabitLogRepository habitLogRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final PushNotificationService pushNotificationService;

    // Pattern to match @username mentions
    private static final Pattern MENTION_PATTERN = Pattern.compile("@(\\w+)");

    @Transactional
    public CommentResponse createComment(CommentRequest request) {
        User currentUser = authService.getCurrentUser();

        HabitLog habitLog = habitLogRepository.findById(request.getHabitLogId())
                .orElseThrow(() -> new RuntimeException("Habit log not found"));

        // Check if user belongs to the same family as the habit owner
        if (currentUser.getFamily() == null ||
            habitLog.getHabit().getFamily() == null ||
            !currentUser.getFamily().getId().equals(habitLog.getHabit().getFamily().getId())) {
            throw new RuntimeException("You can only comment on habits from your family");
        }

        Comment comment = Comment.builder()
                .habitLog(habitLog)
                .user(currentUser)
                .content(request.getContent())
                .build();

        Comment savedComment = commentRepository.save(comment);

        // Parse mentions and send notifications
        sendMentionNotifications(request.getContent(), currentUser, habitLog);

        return CommentResponse.from(savedComment);
    }

    private void sendMentionNotifications(String content, User commenter, HabitLog habitLog) {
        Set<String> mentionedUsernames = extractMentions(content);

        for (String username : mentionedUsernames) {
            userRepository.findByUsername(username).ifPresent(mentionedUser -> {
                // Only send notification if the mentioned user is in the same family
                if (mentionedUser.getFamily() != null &&
                    commenter.getFamily() != null &&
                    mentionedUser.getFamily().getId().equals(commenter.getFamily().getId()) &&
                    !mentionedUser.getId().equals(commenter.getId())) {

                    String title = commenter.getDisplayName() + "님이 회원님을 언급했습니다";
                    String body = "\"" + habitLog.getHabit().getName() + "\" 습관에서: " + truncateContent(content, 50);
                    pushNotificationService.sendNotification(mentionedUser, title, body);
                }
            });
        }
    }

    private Set<String> extractMentions(String content) {
        Set<String> mentions = new HashSet<>();
        Matcher matcher = MENTION_PATTERN.matcher(content);
        while (matcher.find()) {
            mentions.add(matcher.group(1));
        }
        return mentions;
    }

    private String truncateContent(String content, int maxLength) {
        if (content.length() <= maxLength) {
            return content;
        }
        return content.substring(0, maxLength) + "...";
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByHabitLogId(Long habitLogId) {
        User currentUser = authService.getCurrentUser();

        HabitLog habitLog = habitLogRepository.findById(habitLogId)
                .orElseThrow(() -> new RuntimeException("Habit log not found"));

        // Check if user belongs to the same family
        if (currentUser.getFamily() == null ||
            habitLog.getHabit().getFamily() == null ||
            !currentUser.getFamily().getId().equals(habitLog.getHabit().getFamily().getId())) {
            throw new RuntimeException("You can only view comments from your family");
        }

        return commentRepository.findByHabitLogIdWithUser(habitLogId)
                .stream()
                .map(CommentResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteComment(Long commentId) {
        User currentUser = authService.getCurrentUser();

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        // Only the comment author can delete their own comment
        if (!currentUser.getId().equals(comment.getUser().getId())) {
            throw new RuntimeException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }
}

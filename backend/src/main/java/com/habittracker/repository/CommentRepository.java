package com.habittracker.repository;

import com.habittracker.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.habitLog.id = :habitLogId ORDER BY c.createdAt ASC")
    List<Comment> findByHabitLogIdWithUser(@Param("habitLogId") Long habitLogId);

    @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.habitLog.id IN :habitLogIds ORDER BY c.createdAt ASC")
    List<Comment> findByHabitLogIdsWithUser(@Param("habitLogIds") List<Long> habitLogIds);

    void deleteByHabitLogId(Long habitLogId);
}

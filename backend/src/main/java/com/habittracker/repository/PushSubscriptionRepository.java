package com.habittracker.repository;

import com.habittracker.entity.User;
import com.habittracker.model.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    List<PushSubscription> findByUser(User user);
    Optional<PushSubscription> findByUserAndEndpoint(User user, String endpoint);
    void deleteByUserAndEndpoint(User user, String endpoint);
}

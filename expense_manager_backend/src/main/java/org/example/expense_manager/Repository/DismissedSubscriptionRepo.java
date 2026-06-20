package org.example.expense_manager.Repository;

import org.example.expense_manager.Entity.DismissedSubscription;
import org.example.expense_manager.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DismissedSubscriptionRepo extends JpaRepository<DismissedSubscription, Integer>
{

    List<DismissedSubscription> findAllByUser(User user);

    Optional<DismissedSubscription> findByUserAndKeyword(User user, String keyword);

    boolean existsByUserAndKeyword(User user, String keyword);

}

package org.example.expense_manager.Repository;

import org.example.expense_manager.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepo extends JpaRepository<User, Integer>
{
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    User findByUsername(String username);
}

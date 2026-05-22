package org.example.expense_manager.Repository;

import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Entity.UserCategoryMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserCategoryMappingRepo extends JpaRepository<UserCategoryMapping, Integer>
{

    List<UserCategoryMapping> findAllByUser(User user);

    boolean existsByKeywordAndUser(String keyword , User user);
}

package org.example.expense_manager.Repository;

import org.example.expense_manager.Entity.Category;
import org.example.expense_manager.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface CategoryRepo extends JpaRepository<Category, Integer>
{
    boolean existsByCategoryNameAndUser(String categoryName, User user);

    Category getCategoryByCategoryId(int categoryId);

    Optional<Category> findByCategoryIdAndUser(int categoryId, User user);

    List<Category> findAllByUser(User user);


}

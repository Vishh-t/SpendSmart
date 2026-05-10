package org.example.expense_manager.Repository;

import org.example.expense_manager.Entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepo extends JpaRepository<Category, Integer>
{
    boolean existsByCategoryName(String categoryName);

    Category getCategoryByCategoryId(int categoryId);
}

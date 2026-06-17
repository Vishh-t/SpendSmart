package org.example.expense_manager.Repository;

import org.example.expense_manager.Entity.Category;
import org.example.expense_manager.Entity.Expense;
import org.example.expense_manager.Entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;


@Repository
public interface ExpenseRepo extends JpaRepository<Expense, Integer>
{

    List<Expense> findAllByUser(User user);

    List<Expense> findAllByUser(User user, Sort sort);

    List<Expense> findAllByUserAndCategory(User user, Category category);

    List<Expense> findAllByUserAndExpenseTimestampBetween(User user, LocalDateTime start, LocalDateTime end);

    boolean existsByUserAndAmountAndKeywordAndExpenseTimestamp(
            User user, BigDecimal amount, String keyword, LocalDateTime dateTime
    );

    List<Expense> findAllByUserAndKeyword(User user, String oldKeyword);

    Expense findFirstByUserOrderByExpenseTimestampAsc(User user);

    Expense findFirstByUserOrderByExpenseTimestampDesc(User user);

    Page<Expense> findAllByUser(User user, Pageable pageable);

    Page<Expense> findAllByUserAndCategory(User user, Category category, Pageable pageable);

    @Query("SELECT e FROM Expense e WHERE e.user = :user " +
           "AND (:categoryId IS NULL OR e.category.categoryId = :categoryId) " +
           "AND (:search IS NULL OR LOWER(e.description) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(e.category.categoryName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Expense> findFilteredExpenses(@Param("user") User user, @Param("categoryId") Integer categoryId, @Param("search") String search, Pageable pageable);

}

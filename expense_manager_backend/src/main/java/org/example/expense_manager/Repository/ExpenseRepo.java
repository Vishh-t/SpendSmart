package org.example.expense_manager.Repository;

import org.example.expense_manager.Entity.Category;
import org.example.expense_manager.Entity.Expense;
import org.example.expense_manager.Entity.User;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
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

}

package org.example.expense_manager.Service;

import lombok.RequiredArgsConstructor;
import org.example.expense_manager.DTO.ServiceDTOs.CategoryBudgetStatusDTO;
import org.example.expense_manager.Entity.Category;
import org.example.expense_manager.Entity.Expense;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Exceptions.AlreadyExistsException;
import org.example.expense_manager.Exceptions.AppException;
import org.example.expense_manager.Exceptions.NotFoundException;
import org.example.expense_manager.Exceptions.UnauthorizedUserException;
import org.example.expense_manager.Repository.CategoryRepo;
import org.example.expense_manager.Repository.ExpenseRepo;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

import static java.lang.Boolean.TRUE;

@Service
@RequiredArgsConstructor
public class CategoryService
{
    private final CategoryRepo repo;

    private final ExpenseRepo expenseRepo;

    public Boolean addCategory(Category category, User user)
    {
        if (repo.existsByCategoryNameAndUser(category.getCategoryName(), user))
        {
            throw new AlreadyExistsException("Category already exists");
        }
        category.setUser(user);

        repo.save(category);
        return TRUE;

    }

    public Category getCategoryById(int categoryId, User user)
    {
        return repo.findByCategoryIdAndUser(categoryId, user).orElseThrow(() -> new NotFoundException("Category not found "));
    }

    public List<Category> getAllCategories(User user)
    {
        List<Category> list = repo.findAllByUser(user);
        if (list.isEmpty())
        {
            throw new NotFoundException("No Categories Found...");
        }
        return list;
    }

    public Boolean deleteCategory(int categoryId, User user)
    {
        Category category = repo.findById(categoryId).orElse(null);
        if (category == null)
        {
            throw new NotFoundException("Category not found");
        }

        if (!category.getUser().getUserId().equals(user.getUserId()))
        {
            throw new UnauthorizedUserException("Access Unauthorized!! ");
        }
        try
        {
            repo.delete(category);
            return TRUE;
        } catch (DataIntegrityViolationException DIVex)
        {
            throw new AppException("Category is in use and cannot be deleted");
        }

    }

    public Boolean setBudget(int categoryId, User user, BigDecimal monthlyBudget)
    {
        Category category = repo.findById(categoryId).orElse(null);

        if (category == null) throw new NotFoundException("Category not found");

        if (!category.getUser().getUserId().equals(user.getUserId()))
        {
            throw new UnauthorizedUserException("Access Unauthorized!! ");
        }

        category.setMonthlyBudget(monthlyBudget);
        repo.save(category);
        return TRUE;
    }

    public List<CategoryBudgetStatusDTO> categoryBudgetStatus(User user)
    {

        Map<String, BigDecimal> categoryWiseSpent = new HashMap<>();

        LocalDateTime start = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime end = LocalDateTime.now();
        List<Expense> expenses = expenseRepo.findAllByUserAndExpenseTimestampBetween(user, start, end);

        for (var expense : expenses)
        {
            if (expense.getCategory().getMonthlyBudget() != null)
            {
                categoryWiseSpent.merge(expense.getCategory().getCategoryName(), expense.getAmount(), BigDecimal::add);
            }

        }

        List<CategoryBudgetStatusDTO> results = new ArrayList<>();

        for (Map.Entry<String, BigDecimal> entry : categoryWiseSpent.entrySet())
        {
            CategoryBudgetStatusDTO dto = new CategoryBudgetStatusDTO();
            Category category = repo.findByCategoryNameAndUser(entry.getKey(), user);
            BigDecimal monthlyBudget = category.getMonthlyBudget();
            BigDecimal remaining = Objects.requireNonNull(monthlyBudget).subtract(entry.getValue());
            BigDecimal percentageSpent = (monthlyBudget.subtract(remaining)).divide
                    (monthlyBudget, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
            String status;
            if (entry.getValue().compareTo(category.getMonthlyBudget()) >= 0)
                status = "EXCEEDED";
            else if (percentageSpent.compareTo(new BigDecimal("80")) >= 0)
                status = "WARNING";
            else
                status = "ON_TRACK";

            dto.setCategoryBudget(monthlyBudget);
            dto.setStatus(status);
            dto.setCategoryName(category.getCategoryName());
            dto.setRemaining(remaining);
            dto.setPercentage(percentageSpent);
            dto.setSpentThisMonth(entry.getValue());
            results.add(dto);
        }
        return results;
    }
}

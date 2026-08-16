package org.example.expense_manager.Service;

import org.example.expense_manager.DTO.ServiceDTOs.CategoryBudgetStatusDTO;
import org.example.expense_manager.Entity.Category;
import org.example.expense_manager.Entity.Expense;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Repository.CategoryRepo;
import org.example.expense_manager.Repository.ExpenseRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepo categoryRepo;

    @Mock
    private ExpenseRepo expenseRepo;

    private CategoryService categoryService;

    private User testUser;

    @BeforeEach
    void setUp() {
        categoryService = new CategoryService(categoryRepo, expenseRepo);

        testUser = new User();
        testUser.setUserId(1);
        testUser.setUsername("testuser");
    }

    private Category category(String name) {
        Category c = new Category();
        c.setCategoryId(1);
        c.setCategoryName(name);
        c.setUser(testUser);
        return c;
    }

    private Expense expense(String categoryName, double amount, LocalDateTime timestamp) {
        Expense e = new Expense();
        e.setAmount(java.math.BigDecimal.valueOf(amount));
        e.setExpenseTimestamp(timestamp);

        org.example.expense_manager.Entity.Category cat = new org.example.expense_manager.Entity.Category();
        cat.setCategoryId(1);
        cat.setCategoryName(categoryName);
        cat.setUser(testUser);
        cat.setMonthlyBudget(java.math.BigDecimal.valueOf(5000)); // Set budget so CategoryService doesn't skip
        e.setCategory(cat);
        e.setUser(testUser);
        return e;
    }

    // ============================================================
    // ADD CATEGORY TESTS
    // ============================================================

    @Test
    void addCategory_whenNameExists_throwsAlreadyExistsException() {
        Category cat = category("Food");
        when(categoryRepo.existsByCategoryNameAndUser("Food", testUser)).thenReturn(true);

        assertThatThrownBy(() -> categoryService.addCategory(cat, testUser))
                .isInstanceOf(org.example.expense_manager.Exceptions.AlreadyExistsException.class)
                .hasMessageContaining("Category already exists");
    }

    @Test
    void addCategory_whenNew_savesAndReturnsTrue() {
        category("Food");
        when(categoryRepo.existsByCategoryNameAndUser("Food", testUser)).thenReturn(false);
        when(categoryRepo.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        Boolean result = categoryService.addCategory(category("Food"), testUser);

        assertThat(result).isTrue();
        verify(categoryRepo).save(argThat(c -> c.getUser().equals(testUser) && c.getCategoryName().equals("Food")));
    }

    // ============================================================
    // GET CATEGORY BY ID TESTS
    // ============================================================

    @Test
    void getCategoryById_whenFound_returnsCategory() {
        Category cat = category("Food");
        cat.setCategoryId(1);
        when(categoryRepo.findByCategoryIdAndUser(1, testUser)).thenReturn(java.util.Optional.of(cat));

        Category result = categoryService.getCategoryById(1, testUser);

        assertThat(result).isEqualTo(cat);
    }

    @Test
    void getCategoryById_whenNotFound_throwsNotFoundException() {
        when(categoryRepo.findByCategoryIdAndUser(1, testUser)).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> categoryService.getCategoryById(1, testUser))
                .isInstanceOf(org.example.expense_manager.Exceptions.NotFoundException.class);
    }

    // ============================================================
    // GET ALL CATEGORIES TESTS
    // ============================================================

    @Test
    void getAllCategories_whenExists_returnsList() {
        List<Category> cats = List.of(category("Food"), category("Transport"));
        when(categoryRepo.findAllByUser(testUser)).thenReturn(cats);

        List<Category> result = categoryService.getAllCategories(testUser);

        assertThat(result).hasSize(2);
    }

    @Test
    void getAllCategories_whenEmpty_throwsNotFoundException() {
        when(categoryRepo.findAllByUser(testUser)).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> categoryService.getAllCategories(testUser))
                .isInstanceOf(org.example.expense_manager.Exceptions.NotFoundException.class)
                .hasMessageContaining("No Categories Found");
    }

    // ============================================================
    // DELETE CATEGORY TESTS
    // ============================================================

    @Test
    void deleteCategory_whenNotFound_throwsNotFoundException() {
        when(categoryRepo.findById(1)).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> categoryService.deleteCategory(1, testUser))
                .isInstanceOf(org.example.expense_manager.Exceptions.NotFoundException.class)
                .hasMessageContaining("Category not found");
    }

    @Test
    void deleteCategory_whenUnauthorized_throwsUnauthorizedUserException() {
        Category cat = category("Food");
        cat.setUser(testUser);
        cat.setCategoryId(1);

        User otherUser = new User();
        otherUser.setUserId(2);

        when(categoryRepo.findById(1)).thenReturn(java.util.Optional.of(cat));

        assertThatThrownBy(() -> categoryService.deleteCategory(1, otherUser))
                .isInstanceOf(org.example.expense_manager.Exceptions.UnauthorizedUserException.class)
                .hasMessageContaining("Access Unauthorized");
    }

    @Test
    void deleteCategory_whenInUse_throwsAppException() {
        Category cat = category("Food");
        cat.setUser(testUser);
        cat.setCategoryId(1);

        when(categoryRepo.findById(1)).thenReturn(java.util.Optional.of(cat));
        doThrow(new org.springframework.dao.DataIntegrityViolationException("in use"))
                .when(categoryRepo).delete(cat);

        assertThatThrownBy(() -> categoryService.deleteCategory(1, testUser))
                .isInstanceOf(org.example.expense_manager.Exceptions.AppException.class)
                .hasMessageContaining("Category is in use and cannot be deleted");
    }

    @Test
    void deleteCategory_whenValid_deletesAndReturnsTrue() {
        Category cat = category("Food");
        cat.setUser(testUser);
        cat.setCategoryId(1);

        when(categoryRepo.findById(1)).thenReturn(java.util.Optional.of(cat));
        doNothing().when(categoryRepo).delete(cat);

        Boolean result = categoryService.deleteCategory(1, testUser);

        assertThat(result).isTrue();
        verify(categoryRepo).delete(cat);
    }

    // ============================================================
    // SET BUDGET TESTS
    // ============================================================

    @Test
    void setBudget_whenCategoryNotFound_throwsNotFoundException() {
        when(categoryRepo.findById(1)).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> categoryService.setBudget(1, testUser, BigDecimal.valueOf(1000)))
                .isInstanceOf(org.example.expense_manager.Exceptions.NotFoundException.class);
    }

    @Test
    void setBudget_whenUnauthorized_throwsUnauthorizedUserException() {
        Category cat = category("Food");
        cat.setCategoryId(1);

        User otherUser = new User();
        otherUser.setUserId(2);

        when(categoryRepo.findById(1)).thenReturn(java.util.Optional.of(cat));

        assertThatThrownBy(() -> categoryService.setBudget(1, otherUser, BigDecimal.valueOf(1000)))
                .isInstanceOf(org.example.expense_manager.Exceptions.UnauthorizedUserException.class);
    }

    @Test
    void setBudget_whenValid_setsAndSaves() {
        Category cat = category("Food");
        cat.setCategoryId(1);
        cat.setUser(testUser);

        when(categoryRepo.findById(1)).thenReturn(java.util.Optional.of(cat));
        when(categoryRepo.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        Boolean result = categoryService.setBudget(1, testUser, BigDecimal.valueOf(2000));

        assertThat(result).isTrue();
        assertThat(cat.getMonthlyBudget()).isEqualByComparingTo("2000");
        verify(categoryRepo).save(cat);
    }

    // ============================================================
    // CATEGORY BUDGET STATUS TESTS
    // ============================================================

    @Test
    void categoryBudgetStatus_calculatesCorrectly() {
        LocalDateTime startOfMonth = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime endOfMonth = LocalDateTime.now();

        List<Expense> expenses = List.of(
                expense("Food", 3000, startOfMonth.plusDays(5)),
                expense("Food", 2000, startOfMonth.plusDays(10)),
                expense("Transport", 1000, startOfMonth.plusDays(5))
        );
        when(expenseRepo.findAllByUserAndExpenseTimestampBetween(argThat(u -> u.getUserId().equals(testUser.getUserId())), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(expenses);

        List<Category> allCats = List.of(
                categoryWithBudget("Food", 5000),
                categoryWithBudget("Transport", 2000)
        );
        when(categoryRepo.findAllByUser(testUser)).thenReturn(allCats);

        List<CategoryBudgetStatusDTO> result = categoryService.categoryBudgetStatus(testUser);

        assertThat(result).hasSize(2);

        CategoryBudgetStatusDTO food = result.stream().filter(c -> c.getCategoryName().equals("Food")).findFirst().orElseThrow();
        assertThat(food.getSpentThisMonth()).isEqualByComparingTo("5000");
        assertThat(food.getRemaining()).isEqualByComparingTo("0");
        assertThat(food.getStatus()).isEqualTo("EXCEEDED");

        CategoryBudgetStatusDTO transport = result.stream().filter(c -> c.getCategoryName().equals("Transport")).findFirst().orElseThrow();
        assertThat(transport.getSpentThisMonth()).isEqualByComparingTo("1000");
        assertThat(transport.getRemaining()).isEqualByComparingTo("1000");
    }

    @Test
    void categoryBudgetStatus_ignoresCategoriesWithoutBudget() {
    List<Expense> expenses = List.of(
            expense("Food", 3000, LocalDateTime.now().minusDays(5))
    );
    when(expenseRepo.findAllByUserAndExpenseTimestampBetween(eq(testUser), any(), any()))
            .thenReturn(expenses);

    // Category without monthlyBudget should be excluded
    Category catNoBudget = category("Food");
    catNoBudget.setMonthlyBudget(null);

    when(categoryRepo.findAllByUser(testUser)).thenReturn(List.of(catNoBudget));

    List<CategoryBudgetStatusDTO> result = categoryService.categoryBudgetStatus(testUser);

    assertThat(result).isEmpty();
}

private Category categoryWithBudget(String name, double budget) {
    Category c = category(name);
    c.setMonthlyBudget(java.math.BigDecimal.valueOf(budget));
    return c;
}
}
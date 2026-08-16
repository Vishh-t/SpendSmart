package org.example.expense_manager.Service;

import org.example.expense_manager.DTO.ControllerDTOs.BulkExpenseItemDTO;
import org.example.expense_manager.DTO.ServiceDTOs.*;
import org.example.expense_manager.Entity.*;
import org.example.expense_manager.Exceptions.*;
import org.example.expense_manager.Repository.CategoryRepo;
import org.example.expense_manager.Repository.ExpenseRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    private ExpenseRepo expenseRepo;

    @Mock
    private CategoryRepo categoryRepo;

    @Mock
    private SummaryService summaryService;

    private ExpenseService expenseService;

    private User testUser;

    @BeforeEach
    void setUp() {
        expenseService = new ExpenseService(expenseRepo, categoryRepo, summaryService);

        testUser = new User();
        testUser.setUserId(1);
        testUser.setUsername("testuser");
        testUser.setMonthlyBudget(java.math.BigDecimal.valueOf(10000));
    }

    private Category category(int id, String name) {
        Category c = new Category();
        c.setCategoryId(id);
        c.setCategoryName(name);
        c.setUser(testUser);
        return c;
    }

    private Expense expense(int id, String keyword, double amount, LocalDateTime timestamp, String categoryName) {
        Expense e = new Expense();
        e.setExpenseId(id);
        e.setKeyword(keyword);
        e.setAmount(java.math.BigDecimal.valueOf(amount));
        e.setExpenseTimestamp(timestamp);
        e.setDescription("Test expense");

        Category c = new Category();
        c.setCategoryId(1);
        c.setCategoryName(categoryName);
        c.setUser(testUser);
        e.setCategory(c);

        e.setUser(testUser);
        return e;
    }

    private Expense expense(String keyword, double amount, LocalDateTime timestamp, String categoryName) {
        return expense(1, keyword, amount, timestamp, categoryName);
    }

    private BulkExpenseItemDTO bulkItem(int categoryId, double amount, String description, String keyword, LocalDateTime dateTime) {
        BulkExpenseItemDTO item = new BulkExpenseItemDTO();
        item.setCategoryId(categoryId);
        item.setAmount(java.math.BigDecimal.valueOf(amount));
        item.setDescription(description);
        item.setKeyword(keyword);
        item.setDateTime(dateTime);
        return item;
    }

    // ============================================================
    // ADD EXPENSE TESTS
    // ============================================================

    @Test
    void addExpense_whenCategoryNotFound_throwsNotFoundException() {
        when(categoryRepo.findById(999)).thenReturn(java.util.Optional.empty());

        Expense expense = new Expense();
        expense.setAmount(java.math.BigDecimal.valueOf(100));

        assertThatThrownBy(() -> expenseService.addExpense(testUser, 999, expense))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("Category not found");
    }

    @Test
    void addExpense_whenValid_savesAndReturnsResponse() {
        Category cat = category(1, "Food");
        when(categoryRepo.findById(1)).thenReturn(java.util.Optional.of(cat));
        when(expenseRepo.save(any(Expense.class))).thenAnswer(inv -> inv.getArgument(0));

        Expense expense = new Expense();
        expense.setAmount(java.math.BigDecimal.valueOf(500));
        expense.setDescription("Lunch");
        expense.setKeyword("restaurant");
        expense.setExpenseTimestamp(null);

        ExpenseResponseDTO response = expenseService.addExpense(testUser, 1, expense);

        assertThat(response.getAmount()).isEqualByComparingTo("500");
        assertThat(response.getDescription()).isEqualTo("Lunch");
        assertThat(response.getKeyword()).isEqualTo("restaurant");
        assertThat(response.getCategory().getCategoryName()).isEqualTo("Food");
        assertThat(response.getExpenseTimestamp()).isNotNull();
        
        verify(expenseRepo).save(any(Expense.class));
        verify(summaryService).evictUserCaches(1);
    }

    // ============================================================
    // GET EXPENSES BY USER TESTS
    // ============================================================

    @Test
    void getExpensesByUser_returnsAllExpenses() {
        List<Expense> expenses = List.of(
            expense("Food", 500, LocalDateTime.now(), "Food"),
            expense("Transport", 300, LocalDateTime.now(), "Transport")
        );
        when(expenseRepo.findAllByUser(testUser)).thenReturn(expenses);

        List<ExpenseResponseDTO> result = expenseService.getExpensesByUser(testUser);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getAmount()).isEqualByComparingTo("500");
        assertThat(result.get(1).getAmount()).isEqualByComparingTo("300");
    }

    // ============================================================
    // GET EXPENSE BY ID TESTS
    // ============================================================

    @Test
    void getExpenseById_whenNotFound_throwsNotFoundException() {
        when(expenseRepo.findById(999)).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> expenseService.getExpenseById(999, testUser))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void getExpenseById_whenUnauthorized_throwsUnauthorizedUserException() {
        Expense expense = expense(1, "Food", 500, LocalDateTime.now(), "Food");
        expense.setUser(testUser);

        User otherUser = new User();
        otherUser.setUserId(2);

        when(expenseRepo.findById(1)).thenReturn(java.util.Optional.of(expense));

        assertThatThrownBy(() -> expenseService.getExpenseById(1, otherUser))
            .isInstanceOf(UnauthorizedUserException.class);
    }

    @Test
    void getExpenseById_whenValid_returnsResponse() {
        Expense expense = expense(1, "Food", 500, LocalDateTime.now(), "Food");
        expense.setUser(testUser);
        when(expenseRepo.findById(1)).thenReturn(java.util.Optional.of(expense));

        ExpenseResponseDTO result = expenseService.getExpenseById(1, testUser);

        assertThat(result.getExpenseId()).isEqualTo(1);
        assertThat(result.getAmount()).isEqualByComparingTo("500");
    }

    // ============================================================
    // UPDATE EXPENSE TESTS
    // ============================================================

    @Test
    void updateExpense_whenNotFound_throwsNotFoundException() {
        when(expenseRepo.findById(999)).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> expenseService.updateExpense(testUser, 999, 1, new Expense()))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void updateExpense_whenCategoryNotFound_throwsNotFoundException() {
        Expense stored = expense(1, "Food", 500, LocalDateTime.now(), "Food");
        stored.setUser(testUser);
        when(expenseRepo.findById(1)).thenReturn(java.util.Optional.of(stored));
        when(categoryRepo.findById(999)).thenReturn(java.util.Optional.empty());

        Expense update = new Expense();
        update.setAmount(java.math.BigDecimal.valueOf(600));

        assertThatThrownBy(() -> expenseService.updateExpense(testUser, 1, 999, update))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void updateExpense_whenUnauthorized_throwsUnauthorizedUserException() {
        Expense stored = expense(1, "Food", 500, LocalDateTime.now(), "Food");
        stored.setUser(testUser);

        User otherUser = new User();
        otherUser.setUserId(2);
        when(expenseRepo.findById(1)).thenReturn(java.util.Optional.of(stored));
        when(categoryRepo.findById(1)).thenReturn(java.util.Optional.of(category(1, "Food")));

        assertThatThrownBy(() -> expenseService.updateExpense(otherUser, 1, 1, new Expense()))
            .isInstanceOf(UnauthorizedUserException.class);
    }

    @Test
    void updateExpense_whenValid_updatesFields() {
        Expense stored = expense(1, "Food", 500, LocalDateTime.now(), "Food");
        stored.setUser(testUser);
        when(expenseRepo.findById(1)).thenReturn(java.util.Optional.of(stored));
        when(categoryRepo.findById(2)).thenReturn(java.util.Optional.of(category(2, "Transport")));
        when(expenseRepo.save(any(Expense.class))).thenAnswer(inv -> inv.getArgument(0));

        Expense update = new Expense();
        update.setAmount(java.math.BigDecimal.valueOf(600));
        update.setDescription("Updated");
        update.setExpenseTimestamp(LocalDateTime.now().plusDays(1));

        ExpenseResponseDTO result = expenseService.updateExpense(testUser, 1, 2, update);

        assertThat(result.getAmount()).isEqualByComparingTo("600");
        assertThat(result.getDescription()).isEqualTo("Updated");
        assertThat(result.getCategory().getCategoryName()).isEqualTo("Transport");
        verify(summaryService).evictUserCaches(1);
    }

    // ============================================================
    // DELETE EXPENSE TESTS
    // ============================================================

    @Test
    void deleteExpense_whenNotFound_throwsNotFoundException() {
        when(expenseRepo.findById(999)).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> expenseService.deleteExpense(testUser, 999))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void deleteExpense_whenUnauthorized_throwsUnauthorizedUserException() {
        Expense expense = expense(1, "Food", 500, LocalDateTime.now(), "Food");
        expense.setUser(testUser);

        User otherUser = new User();
        otherUser.setUserId(2);
        when(expenseRepo.findById(1)).thenReturn(java.util.Optional.of(expense));

        assertThatThrownBy(() -> expenseService.deleteExpense(otherUser, 1))
            .isInstanceOf(UnauthorizedUserException.class);
    }

    @Test
    void deleteExpense_whenValid_deletesAndReturnsResponse() {
        Expense expense = expense(1, "Food", 500, LocalDateTime.now(), "Food");
        expense.setUser(testUser);
        when(expenseRepo.findById(1)).thenReturn(java.util.Optional.of(expense));
        doNothing().when(expenseRepo).deleteById(1);

        ExpenseResponseDTO result = expenseService.deleteExpense(testUser, 1);

        assertThat(result.getExpenseId()).isEqualTo(1);
        verify(expenseRepo).deleteById(1);
        verify(summaryService).evictUserCaches(1);
    }

    // ============================================================
    // GET EXPENSES BY CATEGORY TESTS
    // ============================================================

    @Test
    void getExpensesByCategory_returnsFilteredExpenses() {
        Category cat = category(1, "Food");
        List<Expense> expenses = List.of(expense("Food", 500, LocalDateTime.now(), "Food"));
        when(categoryRepo.findById(1)).thenReturn(java.util.Optional.of(cat));
        when(expenseRepo.findAllByUserAndCategory(testUser, cat)).thenReturn(expenses);

        List<ExpenseResponseDTO> result = expenseService.getExpensesByCategory(1, testUser);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getCategory().getCategoryName()).isEqualTo("Food");
    }

    // ============================================================
    // GET EXPENSES BY DATE RANGE TESTS
    // ============================================================

    @Test
    void getExpensesByDateRange_whenNoExpenses_throwsNotFoundException() {
        LocalDate start = LocalDate.now().minusDays(7);
        LocalDate end = LocalDate.now();
        when(expenseRepo.findAllByUserAndExpenseTimestampBetween(eq(testUser), any(), any()))
            .thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> expenseService.getExpensesByDateRange(testUser, start, end))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("No Expense found");
    }

    @Test
    void getExpensesByDateRange_whenValid_returnsExpenses() {
        LocalDate start = LocalDate.now().minusDays(7);
        LocalDate end = LocalDate.now();
        List<Expense> expenses = List.of(expense("Food", 500, LocalDateTime.now(), "Food"));
        
        when(expenseRepo.findAllByUserAndExpenseTimestampBetween(eq(testUser), any(), any()))
            .thenReturn(expenses);

        List<ExpenseResponseDTO> result = expenseService.getExpensesByDateRange(testUser, start, end);

        assertThat(result).hasSize(1);
    }

    // ============================================================
    // GET SORTED EXPENSES TESTS
    // ============================================================

    @Test
    void getSortedExpenses_whenInvalidField_throwsInvalidFieldNameException() {
        assertThatThrownBy(() -> expenseService.getSortedExpenses(testUser, "invalidField", "asc"))
            .isInstanceOf(InvalidFieldNameException.class);
    }

    @Test
    void getSortedExpenses_whenValid_returnsSorted() {
        List<Expense> expenses = List.of(
            expense("Food", 500, LocalDateTime.now(), "Food"),
            expense("Transport", 300, LocalDateTime.now(), "Transport")
        );
        when(expenseRepo.findAllByUser(eq(testUser), any(Sort.class))).thenReturn(expenses);

        List<ExpenseResponseDTO> result = expenseService.getSortedExpenses(testUser, "amount", "desc");

        assertThat(result).hasSize(2);
    }

    // ============================================================
    // MONTHLY SUMMARY TESTS
    // ============================================================

    @Test
    void monthlySummary_returnsCorrectSummary() {
        List<Expense> expenses = List.of(
            expense("Food", 5000, LocalDateTime.of(2026, 1, 15, 12, 0), "Food"),
            expense("Transport", 3000, LocalDateTime.of(2026, 1, 20, 12, 0), "Transport")
        );
        when(expenseRepo.findAllByUserAndExpenseTimestampBetween(eq(testUser), any(), any())).thenReturn(expenses);

        MonthlySummaryDTO summary = expenseService.monthlySummary(testUser, 1, 2026);

        assertThat(summary.getMonth()).isEqualTo(1);
        assertThat(summary.getYear()).isEqualTo(2026);
        assertThat(summary.getTotalSpent()).isEqualByComparingTo("8000");
        assertThat(summary.getTransactionCount()).isEqualTo(2);
    }

    // ============================================================
    // CLEAR DESCRIPTION TESTS
    // ============================================================

    @Test
    void clearDescription_whenUnauthorized_throwsUnauthorizedUserException() {
        Expense expense = expense(1, "Food", 500, LocalDateTime.now(), "Food");
        expense.setDescription("Old desc");
        expense.setUser(testUser);

        User otherUser = new User();
        otherUser.setUserId(2);
        when(expenseRepo.findById(1)).thenReturn(java.util.Optional.of(expense));

        assertThatThrownBy(() -> expenseService.clearDescription(otherUser, 1))
            .isInstanceOf(UnauthorizedUserException.class);
    }

    @Test
    void clearDescription_whenValid_clearsAndReturnsOldDescription() {
        Expense expense = expense(1, "Food", 500, LocalDateTime.now(), "Food");
        expense.setDescription("Old desc");
        expense.setUser(testUser);
        when(expenseRepo.findById(1)).thenReturn(java.util.Optional.of(expense));
        when(expenseRepo.save(any(Expense.class))).thenAnswer(inv -> inv.getArgument(0));

        String result = expenseService.clearDescription(testUser, 1);

        assertThat(result).isEqualTo("Old desc");
        assertThat(expense.getDescription()).isNull();
        verify(expenseRepo).save(expense);
    }

    // ============================================================
    // ADD BULK EXPENSES TESTS
    // ============================================================

    @Test
    void addBulkExpenses_whenCategoryNotFound_throwsNotFoundException() {
        BulkExpenseItemDTO item = bulkItem(999, 100, "Test", "test", LocalDateTime.now());
        when(categoryRepo.findAllById(List.of(999))).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> expenseService.addBulkExpenses(testUser, List.of(item)))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void addBulkExpenses_whenValid_createsAllExpenses() {
        Category cat1 = category(1, "Food");
        Category cat2 = category(2, "Transport");
        when(categoryRepo.findAllById(List.of(1, 2))).thenReturn(List.of(cat1, cat2));
        when(expenseRepo.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<BulkExpenseItemDTO> items = List.of(
            bulkItem(1, 500, "Lunch", "restaurant", LocalDateTime.now()),
            bulkItem(2, 300, "Uber", "uber", LocalDateTime.now())
        );

        List<ExpenseResponseDTO> result = expenseService.addBulkExpenses(testUser, items);

        assertThat(result).hasSize(2);
        verify(expenseRepo).saveAll(anyList());
        verify(summaryService).evictUserCaches(1);
    }

    // ============================================================
    // RENAME KEYWORD TESTS
    // ============================================================

    @Test
    void renameKeyword_whenNoExpenses_throwsNotFoundException() {
        when(expenseRepo.findAllByUserAndKeyword(testUser, "old")).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> expenseService.renameKeyword(testUser, "old", "new"))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void renameKeyword_whenValid_renamesAll() {
        List<Expense> expenses = List.of(
            expense("old", 500, LocalDateTime.now(), "Food"),
            expense("old", 300, LocalDateTime.now(), "Food")
        );
        when(expenseRepo.findAllByUserAndKeyword(testUser, "old")).thenReturn(expenses);
        when(expenseRepo.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        String result = expenseService.renameKeyword(testUser, "old", "new");

        assertThat(result).isEqualTo("new");
        assertThat(expenses).allMatch(e -> e.getKeyword().equals("new"));
        verify(expenseRepo).saveAll(expenses);
        verify(summaryService).evictUserCaches(1);
    }

    // ============================================================
    // GET EXPENSES BY KEYWORD TESTS
    // ============================================================

    @Test
    void getExpensesByKeyword_whenNoExpenses_throwsNotFoundException() {
        when(expenseRepo.findAllByUserAndKeyword(testUser, "nonexistent")).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> expenseService.getExpensesByKeyword(testUser, "nonexistent"))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void getExpensesByKeyword_whenValid_returnsExpenses() {
        List<Expense> expenses = List.of(expense("swiggy", 500, LocalDateTime.now(), "Food"));
        when(expenseRepo.findAllByUserAndKeyword(testUser, "swiggy")).thenReturn(expenses);

        List<ExpenseResponseDTO> result = expenseService.getExpensesByKeyword(testUser, "swiggy");

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getKeyword()).isEqualTo("swiggy");
    }

    // ============================================================
    // PAGINATED EXPENSES TESTS
    // ============================================================

    @Test
    void getPaginatedExpenses_returnsPage() {
        List<Expense> expenses = List.of(expense("Food", 500, LocalDateTime.now(), "Food"));
        Page<Expense> page = new PageImpl<>(expenses);
        when(expenseRepo.findAllByUser(eq(testUser), any(Pageable.class))).thenReturn(page);

        Page<ExpenseResponseDTO> result = expenseService.getPaginatedExpenses(testUser, 0, 20, "expenseTimestamp", "desc");

        assertThat(result.getContent()).hasSize(1);
    }

    // ============================================================
    // FILTERED PAGINATED EXPENSES TESTS
    // ============================================================

    @Test
    void getFilteredPaginatedExpenses_returnsPage() {
        List<Expense> expenses = List.of(expense("Food", 500, LocalDateTime.now(), "Food"));
        Page<Expense> page = new PageImpl<>(expenses);
        when(expenseRepo.findFilteredExpenses(eq(testUser), any(), any(), any(Pageable.class))).thenReturn(page);

        Page<ExpenseResponseDTO> result = expenseService.getFilteredPaginatedExpenses(testUser, 0, 20, "expenseTimestamp", "desc", 1, "search");

        assertThat(result.getContent()).hasSize(1);
    }

    // ============================================================
    // GET DASHBOARD SUMMARY TESTS
    // ============================================================

    @Test
    void getDashboardSummary_delegatesToSummaryService() {
        DashboardSummaryDTO dto = new DashboardSummaryDTO();
        when(summaryService.getDashboardSummary(testUser, 2026)).thenReturn(dto);

        DashboardSummaryDTO result = expenseService.getDashboardSummary(testUser, 2026);

        assertThat(result).isSameAs(dto);
        verify(summaryService).getDashboardSummary(testUser, 2026);
    }
}
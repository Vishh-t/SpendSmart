package org.example.expense_manager.Controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.example.expense_manager.DTO.ControllerDTOs.*;
import org.example.expense_manager.Entity.Expense;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Service.ExpenseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/expense")
@RequiredArgsConstructor
public class ExpenseController
{
    private final ExpenseService service;

    @PostMapping("/")
    public ResponseEntity<?> addExpense(@RequestParam int categoryId, @Valid @RequestBody AddExpenseDTO expenseDto)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        Expense expense = new Expense();
        expense.setDescription(expenseDto.getDescription());
        expense.setAmount(expenseDto.getAmount());

        if (expenseDto.getExpenseDate() != null)
        {
            expense.setExpenseTimestamp(expenseDto.getExpenseDate().atStartOfDay());
        }

        return new ResponseEntity<>(service.addExpense(loggedInUser, categoryId, expense), HttpStatus.CREATED);
    }

    @GetMapping("/")
    public ResponseEntity<?> getExpensesByUser()
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.getExpensesByUser(loggedInUser), HttpStatus.OK);
    }

    @GetMapping("/{expenseId}/Id")
    public ResponseEntity<?> getExpenseById(@PathVariable int expenseId)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.getExpenseById(expenseId, loggedInUser), HttpStatus.OK);
    }

    @PutMapping("/{expenseId}")
    public ResponseEntity<?> updateExpense(@PathVariable int expenseId, @Valid @RequestBody UpdateExpenseDTO updateDto)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        Expense expense = new Expense();
        Integer categoryId = updateDto.getCategoryId();
        expense.setDescription(updateDto.getDescription());
        if (updateDto.getExpenseDate() != null)
        {
            expense.setExpenseTimestamp(updateDto.getExpenseDate().atStartOfDay());
        }

        expense.setAmount(updateDto.getAmount());
        return new ResponseEntity<>(service.updateExpense(loggedInUser, expenseId, categoryId, expense), HttpStatus.OK);
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<?> deleteExpense(@PathVariable int expenseId)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.deleteExpense(loggedInUser, expenseId), HttpStatus.OK);
    }

    @GetMapping("/{categoryId}/category")
    public ResponseEntity<?> getExpensesByCategory(@PathVariable int categoryId)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.getExpensesByCategory(categoryId, loggedInUser), HttpStatus.OK);
    }

    @GetMapping("/dateRange")
    public ResponseEntity<?> getExpensesByDateRange(@NotNull @RequestParam LocalDate startDate, @NotNull @RequestParam LocalDate endDate)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();

        return new ResponseEntity<>(service.getExpensesByDateRange(loggedInUser, startDate, endDate), HttpStatus.OK);
    }

    @GetMapping("/sorted")
    public ResponseEntity<?> getSortedExpenses(@NotNull @RequestParam String sortBy, @NotNull @RequestParam String order)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();

        return new ResponseEntity<>(service.getSortedExpenses(loggedInUser, sortBy, order), HttpStatus.OK);
    }

    @GetMapping("/summary")
    public ResponseEntity<?> monthlySummary(@RequestParam @Min(1) @Max(12) int month,
                                            @RequestParam int year)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.monthlySummary(loggedInUser, month, year), HttpStatus.OK);
    }

    @DeleteMapping("/{expenseId}/description")
    public ResponseEntity<?> clearDescription(@PathVariable int expenseId)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.clearDescription(Objects.requireNonNull(loggedInUser), expenseId), HttpStatus.OK);
    }

    @GetMapping("/annualSummary")
    public ResponseEntity<?> annualSummary(@RequestParam int year)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.annualSummary(loggedInUser, year), HttpStatus.OK);
    }

    @GetMapping("/budgetStatus")
    public ResponseEntity<?> checkBudgetStatus()
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.checkBudgetStatus(Objects.requireNonNull(loggedInUser)), HttpStatus.OK);
    }

    @GetMapping("/financialSummary")
    public ResponseEntity<?> financialSummary()
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.financialSummary(loggedInUser), HttpStatus.OK);
    }

    @PostMapping("/bulk")
    public ResponseEntity<?> bulkAddExpenses(@RequestBody List<BulkExpenseItemDTO> items)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.addBulkExpenses(loggedInUser, items), HttpStatus.CREATED);
    }

    @PatchMapping("/renameKeyword")
    public ResponseEntity<?> renameKeyword(@RequestParam String oldKeyword, @RequestParam String newKeyword)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.renameKeyword(loggedInUser, oldKeyword, newKeyword), HttpStatus.OK);
    }


}

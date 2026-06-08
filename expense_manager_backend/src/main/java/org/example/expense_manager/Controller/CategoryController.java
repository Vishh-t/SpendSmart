package org.example.expense_manager.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.expense_manager.Entity.Category;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Objects;

@RestController
@RequiredArgsConstructor
@RequestMapping("/category")
public class CategoryController
{
    private final CategoryService service;

    @PostMapping("/add")
    public ResponseEntity<?> addCategory(@Valid @RequestBody Category category)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.addCategory(category, loggedInUser), HttpStatus.CREATED);
    }

    @GetMapping("/")
    public ResponseEntity<?> getAllCategories()
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.getAllCategories(loggedInUser), HttpStatus.OK);
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<?> getCategoryById(@PathVariable int categoryId)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.getCategoryById(categoryId, loggedInUser), HttpStatus.OK);
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<?> deleteCategory(@PathVariable int categoryId)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.deleteCategory(categoryId, loggedInUser), HttpStatus.OK);
    }

    @PatchMapping("/{categoryId}/budget")
    public ResponseEntity<?> setCategoryBudget(@PathVariable int categoryId, @RequestParam BigDecimal monthlyCategoryBudget)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.setBudget(categoryId, Objects.requireNonNull(loggedInUser), monthlyCategoryBudget), HttpStatus.OK);
    }

    @GetMapping("/categoryBudgetSummary")
    public ResponseEntity<?> categoryBudgetSummary()
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.categoryBudgetStatus(loggedInUser), HttpStatus.OK);
    }



}

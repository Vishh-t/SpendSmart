package org.example.expense_manager.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.expense_manager.Entity.Category;
import org.example.expense_manager.Service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/category")
public class CategoryController
{
    private final CategoryService service;

    @PostMapping("/add")
    public ResponseEntity<?> addCategory(@Valid @RequestBody Category category)
    {
        return new ResponseEntity<>(service.addCategory(category), HttpStatus.CREATED);
    }

    @GetMapping("/")
    public ResponseEntity<?> getAllCategories()
    {
        return new ResponseEntity<>(service.getAllCategories(), HttpStatus.OK);
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<?> getCategoryById( @PathVariable int categoryId)
    {
        return new ResponseEntity<>(service.getCategoryById(categoryId), HttpStatus.OK);
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<?> deleteCategory(@PathVariable int categoryId)
    {
        return new ResponseEntity<>(service.deleteCategory(categoryId), HttpStatus.OK);
    }

}

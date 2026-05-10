package org.example.expense_manager.Service;

import lombok.RequiredArgsConstructor;
import org.example.expense_manager.Entity.Category;
import org.example.expense_manager.Exceptions.AlreadyExistsException;
import org.example.expense_manager.Exceptions.AppException;
import org.example.expense_manager.Exceptions.NotFoundException;
import org.example.expense_manager.Repository.CategoryRepo;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;

import static java.lang.Boolean.TRUE;

@Service
@RequiredArgsConstructor
public class CategoryService
{
    private final CategoryRepo repo;

    public Boolean addCategory(Category category)
    {
        if (repo.existsByCategoryName(category.getCategoryName()))
        {
            throw new AlreadyExistsException("Category already exists");
        }

        repo.save(category);
        return TRUE;

    }

    public Category getCategoryById(int categoryId)
    {
        return repo.findById(categoryId).orElseThrow(() -> new NotFoundException("Category not found "));
    }

    public List<Category> getAllCategories()
    {
        List<Category> list = repo.findAll();
        if (list.isEmpty())
        {
            throw new NotFoundException("No Categories Found...");
        }
        return list;
    }

    public Boolean deleteCategory(int categoryId)
    {
        Category category = repo.findById(categoryId).orElse(null);
        if (category == null)
        {
            throw new NotFoundException("Category not found");
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
}

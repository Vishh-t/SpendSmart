package org.example.expense_manager.Service;

import lombok.RequiredArgsConstructor;
import org.example.expense_manager.Entity.Category;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Exceptions.AlreadyExistsException;
import org.example.expense_manager.Exceptions.AppException;
import org.example.expense_manager.Exceptions.NotFoundException;
import org.example.expense_manager.Exceptions.UnauthorizedUserException;
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
}

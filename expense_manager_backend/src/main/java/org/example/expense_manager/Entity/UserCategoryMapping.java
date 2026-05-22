package org.example.expense_manager.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "user_category_mappings")
public class UserCategoryMapping
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "userId")
    private User user;


    private String keyword;

    @ManyToOne
    @JoinColumn(name = "categoryId")
    private Category category;

}

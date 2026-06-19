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
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "mapping_seq")
    @SequenceGenerator(name = "mapping_seq", sequenceName = "mapping_seq", allocationSize = 50)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "userId")
    private User user;
    
    private String keyword;

    @ManyToOne
    @JoinColumn(name = "categoryId")
    private Category category;

}

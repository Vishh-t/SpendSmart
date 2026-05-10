package org.example.expense_manager.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "expenses")
public class Expense
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer expenseId;

    @ManyToOne
    @JoinColumn(name = "userId")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @ManyToOne
    @JoinColumn(name = "categoryId")
    private Category category;

    @NotNull
    @Min(1)
    private BigDecimal amount;


    private LocalDateTime expenseTimestamp;

    private String description;
}

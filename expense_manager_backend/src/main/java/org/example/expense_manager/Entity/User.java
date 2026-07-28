package org.example.expense_manager.Entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.annotation.Nullable;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@Table(name = "users")
public class User implements UserDetails
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer userId;

    @NotBlank
    private String name;

    @NotBlank
    @Size(min = 8, max = 25)
    private String username;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = true)
    private String password;

    @Column(columnDefinition = "DECIMAL DEFAULT 5000")
    private BigDecimal monthlyBudget = BigDecimal.valueOf(5000);

    @Column(columnDefinition = "INT DEFAULT 0")
    private int importCountToday = 0;

    @Column(columnDefinition = "INT DEFAULT 0")
    private int importCountMonth = 0;

    @Column
    private LocalDate lastImportDate;

    @NotBlank
    @Email
    private String email;

    @Column(unique = true )
    @Nullable
    private String googleId;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities()
    {
        return List.of();
    }

    @Override
    public boolean isAccountNonExpired()
    {
        return true;
    }

    @Override
    public boolean isAccountNonLocked()
    {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired()
    {
        return true;
    }

    @Override
    public boolean isEnabled()
    {
        return true;
    }
}



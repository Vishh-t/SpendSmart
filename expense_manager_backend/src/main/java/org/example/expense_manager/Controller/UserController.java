package org.example.expense_manager.Controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.expense_manager.DTO.ControllerDTOs.LoginDTO;
import org.example.expense_manager.DTO.ControllerDTOs.SignUpDTO;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Objects;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController
{
    private final UserService service;

    @PostMapping("/signUp")
    public ResponseEntity<?> signUp(@Valid @RequestBody SignUpDTO signUpDto)
    {
        return new ResponseEntity<>(service.signUp(signUpDto), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDTO loginDto)
    {
        return new ResponseEntity<>(service.login(loginDto.getUsername(), loginDto.getPassword()), HttpStatus.OK);
    }

    @PutMapping("/budget")
    public ResponseEntity<?> updateMonthlyBudget(@RequestParam BigDecimal newBudget)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.updateMonthlyBudget(newBudget, Objects.requireNonNull(loggedInUser)), HttpStatus.OK);
    }

    @GetMapping("/")
    public ResponseEntity<?> getUserInfo()
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.getUserInfo(loggedInUser), HttpStatus.OK);
    }

    @DeleteMapping("/")
    public ResponseEntity<?> deleteUser()
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.deleteUser(loggedInUser), HttpStatus.OK);
    }

}

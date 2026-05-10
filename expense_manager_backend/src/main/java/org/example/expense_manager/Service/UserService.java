package org.example.expense_manager.Service;


import lombok.RequiredArgsConstructor;
import org.example.expense_manager.DTO.ControllerDTOs.LoginAndSignUpResponseDTO;
import org.example.expense_manager.DTO.ControllerDTOs.SignUpDTO;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Exceptions.AlreadyExistsException;
import org.example.expense_manager.Exceptions.InvalidCredentialsException;
import org.example.expense_manager.Repository.UserRepo;
import org.example.expense_manager.Security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class UserService
{
    private final UserRepo repo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    public LoginAndSignUpResponseDTO signUp(SignUpDTO signUpDto)
    {

        if (repo.existsByUsername(signUpDto.getUsername()))
        {
            throw new AlreadyExistsException("Username already exists , a unique Username recommended");
        }

        if (repo.existsByEmail(signUpDto.getEmail()))
        {
            throw new AlreadyExistsException("Email already exists , a unique emailId is recommended");
        }


        if (signUpDto.getMonthlyBudget() == null)
        {
            signUpDto.setMonthlyBudget(BigDecimal.valueOf(5000));
        }

        String password = signUpDto.getPassword();
        User user = new User();
        user.setUsername(signUpDto.getUsername());
        user.setMonthlyBudget(signUpDto.getMonthlyBudget());
        user.setName(signUpDto.getName());
        user.setEmail(signUpDto.getEmail());
        user.setPassword(encoder.encode(password));

        User savedUser = repo.save(user);
        String authToken = jwtUtil.generateToken(savedUser.getUsername());

        LoginAndSignUpResponseDTO signUpResponseDto = new LoginAndSignUpResponseDTO();
        signUpResponseDto.setUserId(savedUser.getUserId());
        signUpResponseDto.setUsername(savedUser.getUsername());
        signUpResponseDto.setToken(authToken);
        return signUpResponseDto;

    }

    public LoginAndSignUpResponseDTO login(String username, String password)
    {
        User storedUser = repo.findByUsername(username);
        if (storedUser == null || !encoder.matches(password, storedUser.getPassword()))
        {
            throw new InvalidCredentialsException("User not found , try Signing Up first");

        }

        LoginAndSignUpResponseDTO loginResponseDTO = new LoginAndSignUpResponseDTO();
        String authToken = jwtUtil.generateToken(storedUser.getUsername());
        loginResponseDTO.setUserId(storedUser.getUserId());
        loginResponseDTO.setUsername(storedUser.getUsername());
        loginResponseDTO.setToken(authToken);
        return loginResponseDTO;
    }

    public User updateMonthlyBudget(BigDecimal newBudget, User user)
    {

        user.setMonthlyBudget(newBudget);
        return repo.save(user);

    }

    public User getUserInfo(User user)
    {

        return user;
    }

    public User deleteUser(User user)
    {

        repo.delete(user);
        return user;

    }

}

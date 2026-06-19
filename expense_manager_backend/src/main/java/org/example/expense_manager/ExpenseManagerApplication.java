package org.example.expense_manager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ExpenseManagerApplication
{

    public static void main(String[] args)
    {

        SpringApplication.run(ExpenseManagerApplication.class, args);
    }

}

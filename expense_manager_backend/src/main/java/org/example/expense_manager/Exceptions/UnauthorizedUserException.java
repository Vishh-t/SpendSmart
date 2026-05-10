package org.example.expense_manager.Exceptions;

public class UnauthorizedUserException extends AppException
{
    public UnauthorizedUserException(String message)
    {
        super(message);
    }
}

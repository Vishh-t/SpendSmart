package org.example.expense_manager.Exceptions;

public class AlreadyExistsException extends AppException
{
    public AlreadyExistsException(String message)
    {
        super(message);
    }
}
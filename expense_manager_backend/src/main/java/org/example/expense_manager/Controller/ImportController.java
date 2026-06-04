package org.example.expense_manager.Controller;

import lombok.RequiredArgsConstructor;
import org.example.expense_manager.DTO.ServiceDTOs.ParsedTransactionDTO;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Service.ImportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Objects;

@RestController
@RequiredArgsConstructor
@RequestMapping("/import")
public class ImportController
{
    private final ImportService service;


    @PostMapping("/parse")
    public ResponseEntity<List<ParsedTransactionDTO>> parseTransactions(@RequestParam MultipartFile file, @RequestParam boolean includeCredits)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.parseStatement(loggedInUser, file, includeCredits), HttpStatus.OK);
    }

    @PostMapping("/saveMapping")
    public ResponseEntity<?> saveMapping(@RequestParam String keyword, @RequestParam Integer categoryId)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        service.saveMapping(loggedInUser, keyword, categoryId);
        return new ResponseEntity<>(HttpStatus.OK);
    }

}

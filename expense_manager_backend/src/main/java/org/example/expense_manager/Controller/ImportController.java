package org.example.expense_manager.Controller;

import lombok.RequiredArgsConstructor;
import org.example.expense_manager.DTO.ServiceDTOs.ParsedTransactionDTO;
import org.springframework.web.bind.annotation.RequestBody;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Exceptions.AppException;
import org.example.expense_manager.Service.ImportJobStore;
import org.example.expense_manager.Service.ImportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequiredArgsConstructor
@RequestMapping("/import")
public class ImportController
{
    private final ImportService service;
    private final ImportJobStore jobStore;


    @PostMapping("/parse")
    public ResponseEntity<?> parseTransactions(@RequestParam MultipartFile file, @RequestParam boolean includeCredits)
    {
        if (!"application/pdf".equals(file.getContentType()))
            throw new AppException("Only PDF files are supported");
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        String jobId = service.parseStatement(loggedInUser, file, includeCredits);
        return new ResponseEntity<>(Map.of("jobId", jobId), HttpStatus.ACCEPTED);
    }

    @GetMapping("/status/{jobId}")
    public ResponseEntity<?> getJobStatus(@PathVariable String jobId)
    {
        return new ResponseEntity<>(jobStore.getStatus(jobId), HttpStatus.OK);
    }

    @PostMapping("/saveMapping")
    public ResponseEntity<?> saveMapping(@RequestParam String keyword, @RequestParam Integer categoryId)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        service.saveMapping(loggedInUser, keyword, categoryId);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping("/saveMappingsBulk")
    public ResponseEntity<?> saveMappingsBulk(@RequestBody List<org.example.expense_manager.DTO.ControllerDTOs.KeywordMappingDTO> mappings)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        service.saveMappingsBulk(loggedInUser, mappings);
        return new ResponseEntity<>(HttpStatus.OK);
    }

}

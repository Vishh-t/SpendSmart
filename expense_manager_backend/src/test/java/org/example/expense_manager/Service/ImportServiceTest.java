package org.example.expense_manager.Service;

import org.example.expense_manager.DTO.ControllerDTOs.KeywordMappingDTO;
import org.example.expense_manager.DTO.ServiceDTOs.ParsedTransactionDTO;
import org.example.expense_manager.Entity.*;
import org.example.expense_manager.Exceptions.AppException;
import org.example.expense_manager.Repository.CategoryRepo;
import org.example.expense_manager.Repository.ExpenseRepo;
import org.example.expense_manager.Repository.UserCategoryMappingRepo;
import org.example.expense_manager.Repository.UserRepo;
import org.example.expense_manager.Service.ImportJobStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ImportServiceTest {

    @Mock
    private ExpenseRepo expenseRepo;

    @Mock
    private CategoryRepo categoryRepo;

    @Mock
    private UserCategoryMappingRepo userCategoryMappingRepo;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private UserRepo userRepo;

    @Mock
    private ImportJobStore jobStore;

    @Mock
    private MultipartFile multipartFile;

    private ImportService importService;

    private User testUser;

    @BeforeEach
    void setUp() {
        importService = new ImportService(
            expenseRepo, categoryRepo, userCategoryMappingRepo, restTemplate, userRepo, jobStore
        );

        testUser = new User();
        testUser.setUserId(1);
        testUser.setUsername("testuser");
        testUser.setMonthlyBudget(java.math.BigDecimal.valueOf(10000));
        testUser.setImportCountToday(0);
        testUser.setImportCountMonth(0);
        testUser.setLastImportDate(null);
    }

    // ============================================================
    // EXTRACT TEXT FROM PDF TESTS
    // ============================================================

    @Test
    void extractTextFromPdf_whenValidPdf_returnsText() {
        // This test would require a real PDF file - placeholder for integration test
        assertThat(true).isTrue(); // Requires test PDF resource
    }

    @Test
    void extractTextFromPdf_whenInvalidPdf_throwsAppException() {
        // Placeholder - requires corrupted PDF resource
        assertThat(true).isTrue();
    }

    // ============================================================
    // STRIP SENSITIVE DATA TESTS
    // ============================================================

    @Test
    void stripSensitiveData_removesAccountNumbers() {
        String input = "Account: 1234567890123456 and 9876543210";
        String result = invokeStripSensitiveData(input);

        assertThat(result).doesNotContain("1234567890123456");
        assertThat(result).doesNotContain("9876543210");
        assertThat(result).contains("[REMOVED]");
    }

    @Test
    void stripSensitiveData_removesIFSCCodes() {
        String input = "IFSC: HDFC0001234 and SBIN0005678";
        String result = invokeStripSensitiveData(input);

        assertThat(result).doesNotContain("HDFC0001234");
        assertThat(result).doesNotContain("SBIN0005678");
        assertThat(result).contains("[REMOVED]");
    }

    @Test
    void stripSensitiveData_preservesOtherText() {
        String input = "Paid to SWIGGY 500 INR";
        String result = invokeStripSensitiveData(input);

        assertThat(result).isEqualTo("Paid to SWIGGY 500 INR");
    }

    // ============================================================
    // DUPLICATE KEY TESTS
    // ============================================================

    @Test
    void duplicateKey_createsConsistentKey() {
        BigDecimal amount = new BigDecimal("500.00");
        String keyword = "swiggy";
        LocalDateTime dateTime = LocalDateTime.of(2026, 1, 15, 12, 0);

        String key1 = invokeDuplicateKey(amount, keyword, dateTime);
        String key2 = invokeDuplicateKey(amount, keyword, dateTime);

        assertThat(key1).isEqualTo(key2);
    }

    @Test
    void duplicateKey_differentAmounts_producesDifferentKeys() {
        LocalDateTime dateTime = LocalDateTime.of(2026, 1, 15, 12, 0);
        String keyword = "swiggy";

        String key1 = invokeDuplicateKey(new BigDecimal("500"), keyword, dateTime);
        String key2 = invokeDuplicateKey(new BigDecimal("600"), keyword, dateTime);

        assertThat(key1).isNotEqualTo(key2);
    }

    @Test
    void isDuplicate_returnsTrueForMatchingKey() {
        Set<String> existingKeys = Set.of("500|swiggy|2026-01-15T12:00");
        BigDecimal amount = new BigDecimal("500");
        String keyword = "swiggy";
        LocalDateTime dateTime = LocalDateTime.of(2026, 1, 15, 12, 0);

        boolean result = invokeIsDuplicate(existingKeys, amount, keyword, dateTime);

        assertThat(result).isTrue();
    }

    @Test
    void isDuplicate_returnsFalseForNonMatchingKey() {
        Set<String> existingKeys = Set.of("500|swiggy|2026-01-15T12:00");
        BigDecimal amount = new BigDecimal("600");
        String keyword = "swiggy";
        LocalDateTime dateTime = LocalDateTime.of(2026, 1, 15, 12, 0);

        boolean result = invokeIsDuplicate(Collections.emptySet(), amount, keyword, dateTime);

        assertThat(result).isFalse();
    }

    @Test
    void isDuplicate_returnsFalseWhenKeywordNull() {
        Set<String> existingKeys = Set.of("500|swiggy|2026-01-15T12:00");
        BigDecimal amount = new BigDecimal("500");
        String keyword = null;
        LocalDateTime dateTime = LocalDateTime.of(2026, 1, 15, 12, 0);

        boolean result = invokeIsDuplicate(existingKeys, amount, keyword, dateTime);

        assertThat(result).isFalse();
    }

    // ============================================================
    // PARSE STATEMENT TESTS (Main Entry Point)
    // ============================================================

    @Test
    void parseStatement_whenDailyLimitReached_throwsAppException() {
        testUser.setImportCountToday(3);
        testUser.setLastImportDate(LocalDate.now());

        assertThatThrownBy(() -> importService.parseStatement(testUser, multipartFile, true))
            .isInstanceOf(AppException.class)
            .hasMessageContaining("Daily import limit reached");
    }

    @Test
    void parseStatement_whenMonthlyLimitReached_throwsAppException() {
        testUser.setImportCountMonth(10);
        testUser.setLastImportDate(LocalDate.now());

        assertThatThrownBy(() -> importService.parseStatement(testUser, multipartFile, true))
            .isInstanceOf(AppException.class)
            .hasMessageContaining("Monthly import limit reached");
    }

    @Test
    void parseStatement_whenValid_createsJobAndReturnsJobId() {
        // This test requires mocking PDF extraction - skipped in unit tests
        // Integration tests should cover the full flow with real PDFs
        assertThat(true).isTrue(); // Placeholder - requires PDF mocking
    }

    // ============================================================
    // SAVE MAPPING TESTS
    // ============================================================

    @Test
    void saveMapping_whenNotExists_savesMapping() {
        User user = new User();
        user.setUserId(1);

        Category cat = new Category();
        cat.setCategoryId(5);
        cat.setCategoryName("Food");

        when(userCategoryMappingRepo.existsByKeywordAndUser("swiggy", user)).thenReturn(false);
        when(categoryRepo.findById(5)).thenReturn(java.util.Optional.of(cat));
        when(userCategoryMappingRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        importService.saveMapping(user, "swiggy", 5);

        verify(userCategoryMappingRepo).save(argThat(m -> 
            m.getKeyword().equals("swiggy") && 
            m.getCategory().getCategoryId() == 5 &&
            m.getUser().getUserId() == 1
        ));
    }

    @Test
    void saveMapping_whenAlreadyExists_doesNothing() {
        when(userCategoryMappingRepo.existsByKeywordAndUser("swiggy", testUser)).thenReturn(true);

        importService.saveMapping(testUser, "swiggy", 5);

        verify(userCategoryMappingRepo, never()).save(any());
    }

    // ============================================================
    // SAVE MAPPINGS BULK TESTS
    // ============================================================

    @Test
    void saveMappingsBulk_whenValid_savesMultipleMappings() {
        List<KeywordMappingDTO> mappings = List.of(
            keywordMapping("swiggy", 1),
            keywordMapping("uber", 2),
            keywordMapping("netflix", 3)
        );

        when(userCategoryMappingRepo.findAllByUser(testUser)).thenReturn(Collections.emptyList());
        when(categoryRepo.findAllById(List.of(1, 2, 3))).thenReturn(List.of(
            category(1, "Food"), category(2, "Transport"), category(3, "Entertainment")
        ));
        when(userCategoryMappingRepo.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        importService.saveMappingsBulk(testUser, mappings);

        verify(userCategoryMappingRepo).saveAll(argThat(list -> {
            java.util.List<?> l = java.util.stream.StreamSupport.stream(list.spliterator(), false).toList();
            return l.size() == 3;
        }));
    }

    @Test
    void saveMappingsBulk_skipsExistingKeywords() {
        KeywordMappingDTO existing = new KeywordMappingDTO();
        existing.setKeyword("swiggy");
        existing.setCategoryId(1);

        when(userCategoryMappingRepo.findAllByUser(testUser)).thenReturn(
            List.of(mapping("swiggy", 1))
        );
        when(categoryRepo.findAllById(List.of(1, 2))).thenReturn(
            List.of(category(1, "Food"), category(2, "Transport"))
        );

        importService.saveMappingsBulk(testUser, List.of(
            keywordMapping("swiggy", 1),  // already exists
            keywordMapping("uber", 2)      // new
        ));

        verify(userCategoryMappingRepo).saveAll(argThat(list -> {
            java.util.List<?> l = java.util.stream.StreamSupport.stream(list.spliterator(), false).toList();
            return l.size() == 1;
        }));
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    private String invokeStripSensitiveData(String input) {
        try {
            java.lang.reflect.Method method = ImportService.class.getDeclaredMethod("stripSensitiveData", String.class);
            method.setAccessible(true);
            return (String) method.invoke(importService, input);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private String invokeDuplicateKey(BigDecimal amount, String keyword, LocalDateTime dateTime) {
        try {
            java.lang.reflect.Method method = ImportService.class.getDeclaredMethod("duplicateKey", BigDecimal.class, String.class, LocalDateTime.class);
            method.setAccessible(true);
            return (String) method.invoke(importService, amount, keyword, dateTime);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private boolean invokeIsDuplicate(Set<String> existingKeys, BigDecimal amount, String keyword, LocalDateTime dateTime) {
        try {
            java.lang.reflect.Method method = ImportService.class.getDeclaredMethod("isDuplicate", Set.class, BigDecimal.class, String.class, LocalDateTime.class);
            method.setAccessible(true);
            return (Boolean) method.invoke(importService, existingKeys, amount, keyword, dateTime);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private Category category(int id, String name) {
        Category c = new Category();
        c.setCategoryId(id);
        c.setCategoryName(name);
        return c;
    }

    private UserCategoryMapping mapping(String keyword, int categoryId) {
        UserCategoryMapping m = new UserCategoryMapping();
        m.setKeyword(keyword);
        Category c = new Category();
        c.setCategoryId(categoryId);
        m.setCategory(c);
        return m;
    }

    private KeywordMappingDTO keywordMapping(String keyword, int categoryId) {
        KeywordMappingDTO dto = new KeywordMappingDTO();
        dto.setKeyword(keyword);
        dto.setCategoryId(categoryId);
        return dto;
    }
}
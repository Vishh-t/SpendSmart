package org.example.expense_manager.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.expense_manager.DTO.ServiceDTOs.ParsedTransactionDTO;
import org.example.expense_manager.Entity.*;
import org.example.expense_manager.Exceptions.AppException;
import org.example.expense_manager.Repository.CategoryRepo;
import org.example.expense_manager.Repository.ExpenseRepo;
import org.example.expense_manager.Repository.UserCategoryMappingRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ImportServiceParserTest {

    @Mock
    private ExpenseRepo expenseRepo;

    @Mock
    private CategoryRepo categoryRepo;

    @Mock
    private UserCategoryMappingRepo userCategoryMappingRepo;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private org.example.expense_manager.Repository.UserRepo userRepo;

    @Mock
    private ImportJobStore jobStore;

    private ImportService importService;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        importService = new ImportService(
            expenseRepo, categoryRepo, userCategoryMappingRepo, restTemplate, userRepo, jobStore
        );
        objectMapper = new ObjectMapper();
    }

    // ============================================================
    // NORMALIZE KEYWORD TESTS
    // ============================================================

    @Test
    void normalizeKeyword_removesPvtLtd() {
        String result = invokeNormalizeKeyword("SWIGGY PVT LTD");

        assertThat(result).isEqualTo("swiggy");
    }

    @Test
    void normalizeKeyword_removesPrivateLimited() {
        String result = invokeNormalizeKeyword("AMAZON PRIVATE LIMITED");

        assertThat(result).isEqualTo("amazon");
    }

    @Test
    void normalizeKeyword_removesIndia() {
        String result = invokeNormalizeKeyword("UPI PAYMENT TO SWIGGY INDIA");

        assertThat(result).isEqualTo("upi to swiggy");
    }

    @Test
    void normalizeKeyword_removesPaymentServices() {
        String result = invokeNormalizeKeyword("PAYMENT SERVICES ENTERPRISE");

        // "payment", "services", "enterprise" are all in the remove list
        assertThat(result).isEmpty();
    }

    @Test
    void normalizeKeyword_lowercasesAndTrims() {
        String result = invokeNormalizeKeyword("  SWIGGY INSTAMART  ");

        assertThat(result).isEqualTo("swiggy instamart");
    }

    @Test
    void normalizeKeyword_collapsesWhitespace() {
        String result = invokeNormalizeKeyword("SWIGGY    INSTAMART");

        assertThat(result).isEqualTo("swiggy instamart");
    }

    @Test
    void normalizeKeyword_handlesEmptyString() {
        String result = invokeNormalizeKeyword("");

        assertThat(result).isEmpty();
    }

    @Test
    void normalizeKeyword_throwsNPEForNull() {
        // Reflection wraps NPE in InvocationTargetException -> RuntimeException
        assertThatThrownBy(() -> invokeNormalizeKeyword(null))
            .isInstanceOf(RuntimeException.class)
            .hasRootCauseInstanceOf(NullPointerException.class);
    }

    @Test
    void normalizeKeyword_removesEnterprises() {
        String result = invokeNormalizeKeyword("PAVAN ENTERPRISES");

        assertThat(result).isEqualTo("pavan");
    }

    // ============================================================
    // PARSE GEMINI RESPONSE TESTS
    // ============================================================

    @Test
    void parseGeminiResponse_parsesValidJson() throws Exception {
        String json = """
            [
              {
                "amount": 123.45,
                "date": "2026-05-18",
                "time": "14:35",
                "description": "UPI payment to Swiggy",
                "vendor": "swiggy",
                "categoryId": 4,
                "confidenceScore": 96.5
              }
            ]
            """;

        List<ParsedTransactionDTO> result = invokeParseGeminiResponse(json);

        assertThat(result).hasSize(1);
        ParsedTransactionDTO tx = result.get(0);
        assertThat(tx.getAmount()).isEqualByComparingTo("123.45");
        assertThat(tx.getDateTime()).isEqualTo(LocalDateTime.of(2026, 5, 18, 14, 35));
        assertThat(tx.getDescription()).isEqualTo("UPI payment to Swiggy");
        assertThat(tx.getKeyword()).isEqualTo("swiggy");
        assertThat(tx.getCategoryId()).isEqualTo(4);
        assertThat(tx.getConfidenceScore()).isEqualTo(96.5);
    }

    @Test
    void parseGeminiResponse_handlesMissingTime() throws Exception {
        String json = """
            [
              {
                "amount": 100,
                "date": "2026-05-18",
                "description": "Test",
                "vendor": "test"
              }
            ]
            """;

        List<ParsedTransactionDTO> result = invokeParseGeminiResponse(json);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDateTime()).isEqualTo(LocalDateTime.of(2026, 5, 18, 0, 0));
    }

    @Test
    void parseGeminiResponse_handlesMalformedNumbers() throws Exception {
        String json = """
            [
              {
                "amount": 123.,
                "date": "2026-05-18",
                "description": "Test",
                "vendor": "test"
              }
            ]
            """;

        List<ParsedTransactionDTO> result = invokeParseGeminiResponse(json);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getAmount()).isEqualByComparingTo("123.0");
    }

    @Test
    void parseGeminiResponse_handlesCommaInAmount() throws Exception {
        String json = """
            [
              {
                "amount": "1,234",
                "date": "2026-05-18",
                "description": "Test",
                "vendor": "test"
              }
            ]
            """;

        List<ParsedTransactionDTO> result = invokeParseGeminiResponse(json);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getAmount()).isEqualByComparingTo("1234");
    }

    @Test
    void parseGeminiResponse_skipsInvalidAmount() throws Exception {
        String json = """
            [
              {
                "amount": "abc",
                "date": "2026-05-18",
                "description": "Test",
                "vendor": "test"
              }
            ]
            """;

        List<ParsedTransactionDTO> result = invokeParseGeminiResponse(json);

        assertThat(result).isEmpty();
    }

    @Test
    void parseGeminiResponse_skipsMissingDate() throws Exception {
        String json = """
            [
              {
                "amount": 100,
                "description": "Test",
                "vendor": "test"
              }
            ]
            """;

        List<ParsedTransactionDTO> result = invokeParseGeminiResponse(json);

        assertThat(result).isEmpty();
    }

    @Test
    void parseGeminiResponse_handlesMarkdownCodeBlocks() throws Exception {
        String json = """
            ```json
            [
              {
                "amount": 100,
                "date": "2026-05-18",
                "description": "Test",
                "vendor": "test"
              }
            ]
            ```
            """;

        List<ParsedTransactionDTO> result = invokeParseGeminiResponse(json);

        assertThat(result).hasSize(1);
    }

    @Test
    void parseGeminiResponse_handlesMultipleArrays() throws Exception {
        // Service replaces "][" with "," to merge multiple arrays
        String json = """
            [
              {"amount": 100, "date": "2026-05-18", "description": "A", "vendor": "a"}
            ][
              {"amount": 200, "date": "2026-05-19", "description": "B", "vendor": "b"}
            ]
            """;

        List<ParsedTransactionDTO> result = invokeParseGeminiResponse(json);

        assertThat(result).hasSize(2);
    }

    @Test
    void parseGeminiResponse_salvagesTruncatedJson() throws Exception {
        String json = """
            [
              {"amount": 100, "date": "2026-05-18", "description": "A", "vendor": "a"},
              {"amount": 200, "date": "2026-05-19", "description": "B", "vendor": "b"
            ]
            """;

        List<ParsedTransactionDTO> result = invokeParseGeminiResponse(json);

        // Should salvage at last complete object
        assertThat(result).hasSize(1);
    }

    @Test
    void parseGeminiResponse_handlesEmptyArray() throws Exception {
        String json = "[]";

        List<ParsedTransactionDTO> result = invokeParseGeminiResponse(json);

        assertThat(result).isEmpty();
    }

    // ============================================================
    // APPLY USER MAPPINGS TESTS
    // ============================================================

    @Test
    void applyUserMappings_appliesExistingMappings() {
        User user = new User();
        user.setUserId(1);

        UserCategoryMapping mapping = new UserCategoryMapping();
        mapping.setKeyword("swiggy");
        Category cat = new Category();
        cat.setCategoryId(5);
        mapping.setCategory(cat);

        when(userCategoryMappingRepo.findAllByUser(any(User.class))).thenReturn(List.of(mapping));

        ParsedTransactionDTO tx = new ParsedTransactionDTO();
        tx.setKeyword("swiggy");
        tx.setCategoryId(null);

        List<ParsedTransactionDTO> transactions = List.of(tx);

        List<ParsedTransactionDTO> result = invokeApplyUserMappings(new User(), transactions);

        assertThat(result.get(0).getCategoryId()).isEqualTo(5);
    }

    @Test
    void applyUserMappings_overridesExistingCategoryId() {
        User user = new User();

        UserCategoryMapping mapping = new UserCategoryMapping();
        mapping.setKeyword("swiggy");
        Category cat = new Category();
        cat.setCategoryId(5);
        mapping.setCategory(cat);

        when(userCategoryMappingRepo.findAllByUser(any(User.class))).thenReturn(Collections.singletonList(mapping));

        ParsedTransactionDTO tx = new ParsedTransactionDTO();
        tx.setKeyword("swiggy");
        tx.setCategoryId(99); // Already set

        List<ParsedTransactionDTO> transactions = List.of(tx);

        List<ParsedTransactionDTO> result = invokeApplyUserMappings(new User(), transactions);

        // Method ALWAYS overwrites existing categoryId if mapping exists
        assertThat(result.get(0).getCategoryId()).isEqualTo(5);
    }

    @Test
    void applyUserMappings_handlesNoMappings() {
        when(userCategoryMappingRepo.findAllByUser(any(User.class))).thenReturn(Collections.emptyList());

        ParsedTransactionDTO tx = new ParsedTransactionDTO();
        tx.setKeyword("swiggy");
        tx.setCategoryId(null);

        List<ParsedTransactionDTO> result = invokeApplyUserMappings(new User(), List.of(tx));

        assertThat(result.get(0).getCategoryId()).isNull();
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    private String invokeNormalizeKeyword(String input) {
        try {
            java.lang.reflect.Method method = ImportService.class.getDeclaredMethod("normalizeKeyword", String.class);
            method.setAccessible(true);
            return (String) method.invoke(importService, input);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @SuppressWarnings("unchecked")
    private List<ParsedTransactionDTO> invokeParseGeminiResponse(String json) {
        try {
            java.lang.reflect.Method method = ImportService.class.getDeclaredMethod("parseGeminiResponse", String.class);
            method.setAccessible(true);
            return (List<ParsedTransactionDTO>) method.invoke(importService, json);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @SuppressWarnings("unchecked")
    private List<ParsedTransactionDTO> invokeApplyUserMappings(User user, List<ParsedTransactionDTO> transactions) {
        try {
            java.lang.reflect.Method method = ImportService.class.getDeclaredMethod("applyUserMappings", User.class, List.class);
            method.setAccessible(true);
            return (List<ParsedTransactionDTO>) method.invoke(importService, user, transactions);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
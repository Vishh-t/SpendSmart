package org.example.expense_manager.Service;


import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.example.expense_manager.DTO.ControllerDTOs.KeywordMappingDTO;
import org.example.expense_manager.DTO.ServiceDTOs.ParsedTransactionDTO;
import org.example.expense_manager.Entity.Category;
import org.example.expense_manager.Entity.Expense;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Entity.UserCategoryMapping;
import org.example.expense_manager.Exceptions.AppException;
import org.example.expense_manager.Exceptions.NotFoundException;
import org.example.expense_manager.Repository.CategoryRepo;
import org.example.expense_manager.Repository.ExpenseRepo;
import org.example.expense_manager.Repository.UserCategoryMappingRepo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImportService
{
    @Value("${gemini.api.key}")
    private String api_key;

    @Value("${gemini.api.url}")
    private String api_url;

    @Value("${gemini.api.fallback1.url}")
    private String api_fallback1_url;

    @Value("${gemini.api.fallback2.url}")
    private String api_fallback2_url;

    @Value("${gemini.api.fallback3.url}")
    private String api_fallback3_url;

    final private ExpenseRepo expenseRepo;
    final private CategoryRepo categoryRepo;
    final private UserCategoryMappingRepo userCategoryMappingRepo;
    final private RestTemplate template;
    final private org.example.expense_manager.Repository.UserRepo userRepo;
    final private ImportJobStore jobStore;

    private static final int MAX_RETRIES = 3;
    private static final long INITIAL_DELAY = 3000L;

    private static final String GEMINI_PROMPT = """
            You must respond with ZERO creativity. Be purely deterministic and analytical.
            
            You are a high-precision financial transaction extraction engine specialized in Indian bank statements.
            
            Your task is to parse raw bank statement text and extract transactions into STRICT VALID JSON.
            
            You must handle Indian bank statement formats from multiple banks including:
            - UPI
            - NEFT
            - IMPS
            - RTGS
            - ACH
            - POS
            - ECOM
            - CARD
            - ATM
            - WALLET
            - PHONEPE
            - GPAY
            - PAYTM
            - NETBANKING
            - CHEQUE
            - AUTO-DEBIT
            
            OUTPUT:
            Return ONLY a valid JSON array.
            Do NOT return markdown.
            Do NOT return explanations.
            Do NOT return comments.
            Do NOT wrap in ```json.
            If no transactions found, return []
            
            JSON FORMAT:
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
            
            FIELD RULES:
            
            1. amount
            - Must be a positive number
            - No commas
            - No currency symbols
            - Always positive regardless of debit or credit
            
            2. date
            - Format strictly as yyyy-MM-dd
            - Convert ALL detected date formats (dd/MM/yyyy, dd-MM-yyyy, dd MMM yyyy, dd-MMM-yy, MMM dd yyyy) to yyyy-MM-dd
            - Dates are often stated ONCE and apply to multiple transactions below them
            - If a transaction has a time but no explicit date, INHERIT the date from the most recent transaction directly above it
            - Only use null if absolutely no date can be determined even by inheritance
            - Never hallucinate a date
            
            3. description
            - Create a short clean readable transaction description
            - Remove excessive IDs and reference numbers
            - Keep meaningful payment context
            - Maximum 60 characters
            
            GOOD:
            "UPI payment to Swiggy"
            "Netflix subscription"
            "Amazon purchase"
            "ATM withdrawal"
            
            BAD:
            "UPI/DR/937944286112/SWIGGY/YESB/002261"
            
            4. vendor
            MOST IMPORTANT FIELD - must be stable and consistent for a categorization mapping system.
            
            Extract ONLY the core merchant/vendor/entity name.
            
            Rules:
            - lowercase only
            - remove bank names
            - remove transaction IDs
            - remove IFSC codes
            - remove UTR numbers
            - remove references
            - remove city/location names
            - remove payment method words
            - remove company suffixes
            
            ALWAYS REMOVE WORDS:
            pvt, ltd, private, limited, payment, upi, neft, imps, rtgs, pos, ecom, debit, card, txn, ref, transfer, india, bangalore, mumbai, delhi, hyderabad
            
            CONSISTENCY RULE - these must all produce the same vendor:
            "SWIGGY INSTAMART" → "swiggy"
            "SWIGGY LIMITED" → "swiggy"
            "SWIGGY BLR" → "swiggy"
            "ECOM/RAZORPAY/SWIGGY/123" → "swiggy"
            
            GOOD vendor examples:
            "swiggy", "netflix", "amazon", "zomato", "phonepe", "bigbasket", "uber", "ola"
            
            BAD vendor examples:
            "SWIGGY LIMITED", "UPI-SWIGGY-ICICI", "PAYMENT TO AMAZON", "RAZORPAY SWIGGY"
            
            5. categoryId
            - Pick the MOST LIKELY category from the provided list ONLY
            - Use null if unsure or no good match exists
            - Never invent or guess category IDs not in the list
            
            6. confidenceScore
            - 0 to 100 scale
            - 90 to 100: well-known merchants with clear category match (swiggy→food, netflix→entertainment)
            - 60 to 89: recognizable merchant but some ambiguity
            - Below 60: unknown, unclear, or ambiguous merchant
            - Never give 90+ to unknown merchants
            
            7. time
            - Format strictly as HH:mm (24 hour)
            - Convert AM/PM to 24 hour format
            - If time cannot be determined, use null
            
            DEBIT vs CREDIT FILTERING:
            INCLUDE CREDITS is set to: {includeCredits}
            
            If INCLUDE CREDITS is false, exclude:
            - salary received
            - refunds
            - cash deposits
            - incoming transfers
            - interest credits
            - cashback
            - reversals
            
            If INCLUDE CREDITS is true, include ALL transactions.
            
            UNDERSTANDING FRAGMENTED PDF TEXT:
            Bank statement PDFs are converted to raw text which often fragments transactions across multiple lines.
            
            For PhonePe statements, a single transaction typically appears like this across multiple lines:
            Line 1: Date (e.g., May 15, 2026)
            Line 2: Time (e.g., 01:05 pm)
            Line 3: Description (e.g., Paid to Swiggy)
            Line 4: Transaction ID (e.g., T260515...)
            Line 5: UTR No. XXXXXXXXX
            Line 6: Type (DEBIT or CREDIT)
            Line 7: Amount (e.g., ₹450)
            
            You must scan forward AND backward across up to 10 lines to piece these elements together into one transaction.
            
            For AU Bank statements, transactions appear like:
            Line 1: Transaction Date
            Line 2: Value Date
            Line 3: Description/Narration (may span multiple lines)
            Line 4: Amount
            
            EXTRACTION PHILOSOPHY:
            - Prefer COMPLETENESS over perfection
            - If amount AND date are identifiable, include the transaction even if description is unclear
            - Use best effort for vendor name if not perfectly clear
            - Only skip a transaction if BOTH amount AND date are completely unidentifiable
            - Never hallucinate amounts or dates
            - Process the ENTIRE text from start to finish, do not stop early
            - Extract EVERY transaction you can identify
            
            VERIFICATION STEP (MANDATORY):
            Before finalizing the JSON array:
            1. Scan back through the entire text
            2. Find every ₹ symbol or currency amount present
            3. Verify every such amount has a corresponding JSON entry
            4. If any ₹ amount is missing from your JSON, add it before returning
            
            SPECIAL NORMALIZATION EXAMPLES:
            
            INPUT: "UPI/DR/937944286112/PAVAN ENTERPRISES/YESB/002261100000025/PAYMENT FROM PHONEPE"
            OUTPUT vendor: "pavan enterprises"
            
            INPUT: "ECOM/RAZORPAY/SWIGGY/123456"
            OUTPUT vendor: "swiggy"
            
            INPUT: "ACH/NETFLIX ENTERTAINM/12345"
            OUTPUT vendor: "netflix"
            
            INPUT: "POS/VISA/AMAZON MKTPLC/998877"
            OUTPUT vendor: "amazon"
            
            INPUT: "Paid to Vending Brothers Pvt. Ltd"
            OUTPUT vendor: "vending brothers"
            
            INPUT: "UPI/DR/525011837162/PAVAN ENTERPRISES/YESB/002261100000025/PAYMENT FROM PHONEPE AU JAGATPURA"
            OUTPUT vendor: "pavan enterprises"
            
            AVAILABLE CATEGORIES (use ONLY these categoryIds):
            {categoryList}
            
            BANK STATEMENT TEXT:
            {statementText}
            """;

    private String extractTextFromPdf(MultipartFile file)
    {
        try (PDDocument document = Loader.loadPDF(file.getBytes()))
        {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
        catch (Exception ex)
        {
            throw new AppException("Could not read PDF");
        }
    }

    private String stripSensitiveData(String text)
    {
        return text
                .replaceAll("\\b\\d{10,16}\\b", "[REMOVED]")
                .replaceAll("[A-Z]{4}0[A-Z0-9]{6}", "[REMOVED]");
    }

    private String normalizeKeyword(String rawVendor)
    {
        return rawVendor.toLowerCase()
                .replaceAll("\\b(pvt|ltd|private|limited|india|payment|services|enterprise|enterprises)\\b", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private boolean isDuplicate(Set<String> existingKeys, BigDecimal amount, String keyword, LocalDateTime dateTime)
    {
        if (keyword == null) return false;
        return existingKeys.contains(duplicateKey(amount, keyword, dateTime));
    }

    private String duplicateKey(BigDecimal amount, String keyword, LocalDateTime dateTime)
    {
        return amount.stripTrailingZeros().toPlainString() + "|" + keyword + "|" + dateTime;
    }

    private String tryUrl(String url, HttpEntity<Map<String, Object>> entity, String modelLabel)
    {
        long delayMs = INITIAL_DELAY;

        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++)
        {
            try
            {
                return template.postForObject(url + "?key=" + api_key, entity, String.class);
            }
            catch (HttpServerErrorException e)
            {
                int code = e.getStatusCode().value();
                boolean isOverload = code == 503 || code == 529;
                boolean isQuotaExhausted = code == 429;

                if (isQuotaExhausted)
                {
                    throw e;
                }
                else if (isOverload && attempt < MAX_RETRIES)
                {
                    try { Thread.sleep(delayMs); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                    delayMs *= 2;
                }
                else if (isOverload)
                {
                    throw e;
                }
                else
                {
                    throw new AppException("Gemini API error (" + modelLabel + "): " + e.getMessage());
                }
            }
        }

        throw new AppException("Gemini retry loop exhausted unexpectedly (" + modelLabel + ").");
    }

    private String callGeminiWithFallback(HttpEntity<Map<String, Object>> entity)
    {
        List<String[]> models = List.of(
                new String[]{api_url,          "gemini-3-flash-preview (primary)"},
                new String[]{api_fallback1_url, "gemini-3.1-flash-lite (fallback 1)"},
                new String[]{api_fallback2_url, "gemini-2.5-flash (fallback 2)"},
                new String[]{api_fallback3_url, "gemini-2.5-flash-lite (fallback 3)"}
        );

        Exception lastException = null;
        for (String[] model : models)
        {
            try
            {
                return tryUrl(model[0], entity, model[1]);
            }
            catch (HttpServerErrorException e)
            {
                int code = e.getStatusCode().value();
                if (code == 503 || code == 529 || code == 429)
                {
                    lastException = e;
                }
                else
                {
                    throw new AppException("Gemini API error: " + e.getMessage());
                }
            }
            catch (AppException e)
            {
                lastException = e;
            }
        }
        throw new AppException("All Gemini models are currently overloaded. Please try again in a few minutes.");
    }

    private String callGemini(List<Category> categoryList, String statementText, boolean includeCredits)
    {
        StringBuilder categories = new StringBuilder();
        for (Category category : categoryList)
        {
            categories.append(category.getCategoryId()).append(" : ").append(category.getCategoryName()).append("\n");
        }

        String[] pages = statementText.split("\f");
        if (pages.length > 50)
        {
            throw new AppException("PDF too large — maximum 50 pages allowed. Please upload a shorter statement.");
        }

        StringBuilder text = new StringBuilder();
        StringBuilder allResponses = new StringBuilder();
        ObjectMapper mapper = new ObjectMapper();

        for (int i = 0; i < pages.length; i = i + 3)
        {
            for (int j = i; j < i + 3 && j < pages.length; j++)
            {
                text.append(pages[j]);
            }

            String finalPrompt = GEMINI_PROMPT
                    .replace("{categoryList}", categories.toString())
                    .replace("{includeCredits}", String.valueOf(includeCredits))
                    .replace("{statementText}", text);

            Map<String, Object> part = new HashMap<>();
            part.put("text", finalPrompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(part));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("maxOutputTokens", 65536);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(content));
            requestBody.put("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String responseBody = callGeminiWithFallback(entity);

            try
            {
                JsonNode root = mapper.readTree(responseBody);
                JsonNode candidates = root.path("candidates");
                if (candidates.isMissingNode() || !candidates.isArray() || candidates.isEmpty())
                    throw new AppException("Gemini returned an empty response for pages " + (i + 1) + "–" + Math.min(i + 3, pages.length));
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isMissingNode() || !parts.isArray() || parts.isEmpty())
                    throw new AppException("Gemini returned incomplete content for pages " + (i + 1) + "–" + Math.min(i + 3, pages.length));
                JsonNode textNode = parts.get(0).path("text");
                if (textNode.isMissingNode() || !textNode.isTextual() || textNode.textValue().isBlank())
                    throw new AppException("Gemini returned no text for pages " + (i + 1) + "–" + Math.min(i + 3, pages.length));
                allResponses.append(textNode.textValue());
            }
            catch (AppException e)
            {
                throw e;
            }
            catch (Exception e)
            {
                throw new AppException("Gemini response parsing failed on pages " + (i + 1) + "–" + Math.min(i + 3, pages.length) + ": " + e.getMessage());
            }

            text.setLength(0);
        }

        return allResponses.toString();
    }

    private List<ParsedTransactionDTO> parseGeminiResponse(String rawResponse)
    {
        try
        {
            ObjectMapper mapper = new ObjectMapper();

            String cleaned = rawResponse
                    .replaceAll("(?s)```json", "")
                    .replaceAll("(?s)```", "")
                    .trim();

            String mergedJSON = cleaned.replace("][", ",");

            // Fix malformed numbers Gemini sometimes produces
            mergedJSON = mergedJSON.replaceAll("(\\d+\\.)(\\D)", "$10$2");   // 123.X  → 123.0X
            mergedJSON = mergedJSON.replaceAll("(\\d+\\.)(?=[}\\],])", "$10"); // 123.}  → 123.0}
            mergedJSON = mergedJSON.replaceAll("(\\d),(\\d{3})", "$1$2");      // 1,234  → 1234

            JsonNode transactions;
            try
            {
                transactions = mapper.readTree(mergedJSON);
            }
            catch (Exception e)
            {
                // Attempt to salvage truncated JSON by closing the array at the last complete object
                int lastComplete = mergedJSON.lastIndexOf("},");
                if (lastComplete == -1) lastComplete = mergedJSON.lastIndexOf("}");
                if (lastComplete != -1)
                {
                    String salvaged = mergedJSON.substring(0, lastComplete + 1) + "]";
                    if (!salvaged.startsWith("[")) salvaged = "[" + salvaged;
                    try { transactions = mapper.readTree(salvaged); }
                    catch (Exception e2) { throw new AppException("Failed to parse Gemini response even after salvage attempt: " + e.getMessage()); }
                }
                else
                {
                    throw new AppException("Failed to parse Gemini response: " + e.getMessage());
                }
            }

            List<ParsedTransactionDTO> results = new ArrayList<>();

            for (JsonNode transaction : transactions)
            {
                JsonNode amountNode = transaction.get("amount");
                JsonNode dateNode   = transaction.get("date");
                if (amountNode == null || amountNode.isMissingNode() || amountNode.isNull()) continue;
                if (dateNode == null || dateNode.isMissingNode() || dateNode.isNull() || !dateNode.isTextual()) continue;

                String rawAmount = amountNode.toString().replaceAll("[^0-9.]", "");
                if (rawAmount.isBlank()) continue;

                BigDecimal amount;
                try { amount = new BigDecimal(rawAmount); } catch (Exception e) { continue; }

                String rawDate = dateNode.textValue();
                LocalDate parsedDate;
                try { parsedDate = LocalDate.parse(rawDate); } catch (Exception e) { continue; }

                JsonNode timeNode = transaction.get("time");
                String rawTime = (timeNode != null && timeNode.isTextual()) ? timeNode.textValue() : null;

                LocalDateTime dateTime;
                try
                {
                    dateTime = (rawTime != null)
                            ? LocalDateTime.parse(rawDate + "T" + rawTime + ":00")
                            : parsedDate.atStartOfDay();
                }
                catch (Exception e) { dateTime = parsedDate.atStartOfDay(); }

                JsonNode descNode   = transaction.get("description");
                String description  = (descNode != null && descNode.isTextual()) ? descNode.textValue() : "Unknown transaction";

                JsonNode vendorNode = transaction.get("vendor");
                String keyword      = (vendorNode != null && vendorNode.isTextual() && !vendorNode.textValue().isBlank())
                        ? normalizeKeyword(vendorNode.textValue()) : null;

                JsonNode categoryIdNode = transaction.get("categoryId");
                Integer categoryId      = (categoryIdNode != null && categoryIdNode.isInt()) ? categoryIdNode.intValue() : null;

                JsonNode confidenceNode = transaction.get("confidenceScore");
                Double confidenceScore  = (confidenceNode != null && confidenceNode.isNumber()) ? confidenceNode.doubleValue() : null;

                ParsedTransactionDTO result = new ParsedTransactionDTO();
                result.setDescription(description);
                result.setDateTime(dateTime);
                result.setAmount(amount);
                result.setKeyword(keyword);
                result.setCategoryId(categoryId);
                result.setConfidenceScore(confidenceScore);
                results.add(result);
            }

            return results;
        }
        catch (Exception e)
        {
            throw new AppException("Failed to parse Gemini response: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }
    }

    private List<ParsedTransactionDTO> applyUserMappings(User user, List<ParsedTransactionDTO> transactions)
    {
        List<UserCategoryMapping> mappings = userCategoryMappingRepo.findAllByUser(user);
        HashMap<String, Integer> map = new HashMap<>();
        for (UserCategoryMapping mapping : mappings)
        {
            map.put(mapping.getKeyword(), mapping.getCategory().getCategoryId());
        }
        for (var transaction : transactions)
        {
            if (map.containsKey(transaction.getKeyword()))
            {
                transaction.setCategoryId(map.get(transaction.getKeyword()));
            }
        }
        return transactions;
    }

    public String parseStatement(User user, MultipartFile file, boolean includeCredits)
    {
        LocalDate today = LocalDate.now();
        if (user.getLastImportDate() == null || !user.getLastImportDate().equals(today))
        {
            user.setImportCountToday(0);
            if (user.getLastImportDate() == null || user.getLastImportDate().getMonth() != today.getMonth())
            {
                user.setImportCountMonth(0);
            }
            user.setLastImportDate(today);
        }
        if (user.getImportCountToday() >= 3)
            throw new AppException("Daily import limit reached (3/day). Try again tomorrow.");
        if (user.getImportCountMonth() >= 10)
            throw new AppException("Monthly import limit reached (10/month). Resets next month.");

        userRepo.save(user);

        String text = extractTextFromPdf(file);
        String strippedText = stripSensitiveData(text);
        List<Category> categories = categoryRepo.findAllByUser(user);

        if (categories.isEmpty())
        {
            throw new AppException("You have no categories set up yet. Please create at least one category before importing a statement.");
        }

        String jobId = jobStore.createJob();
        Thread.ofVirtual().start(() -> runParseJob(jobId, user, strippedText, categories, includeCredits));
        return jobId;
    }

    private void runParseJob(String jobId, User user, String strippedText, List<Category> categories, boolean includeCredits)
    {
        try
        {
            String rawStatements = callGemini(categories, strippedText, includeCredits);
            List<ParsedTransactionDTO> statements = parseGeminiResponse(rawStatements);
            List<ParsedTransactionDTO> parsedStatements = applyUserMappings(user, statements);

            LocalDateTime minDate = null;
            LocalDateTime maxDate = null;

            for (var trans : parsedStatements)
            {
                if (trans.getDateTime() == null) continue;
                if (minDate == null || trans.getDateTime().isBefore(minDate)) minDate = trans.getDateTime();
                if (maxDate == null || trans.getDateTime().isAfter(maxDate))  maxDate = trans.getDateTime();
            }

            Set<String> existingKeys;
            if (minDate != null && maxDate != null)
            {
                List<Expense> existingExpenses = expenseRepo.findAllByUserAndExpenseTimestampBetween(user, minDate, maxDate);
                existingKeys = existingExpenses.stream()
                        .filter(e -> e.getKeyword() != null)
                        .map(e -> duplicateKey(e.getAmount(), e.getKeyword(), e.getExpenseTimestamp()))
                        .collect(Collectors.toSet());
            }
            else
            {
                existingKeys = Set.of();
            }

            for (var trans : parsedStatements)
            {
                if (isDuplicate(existingKeys, trans.getAmount(), trans.getKeyword(), trans.getDateTime()))
                {
                    trans.setDuplicate(true);
                }
            }

            user.setImportCountToday(user.getImportCountToday() + 1);
            user.setImportCountMonth(user.getImportCountMonth() + 1);
            userRepo.save(user);

            jobStore.markDone(jobId, parsedStatements);
        }
        catch (Exception e)
        {
            jobStore.markFailed(jobId, e.getMessage() != null ? e.getMessage() : "Failed to parse statement");
        }
    }

    public void saveMapping(User user, String keyword, Integer categoryId)
    {
        if (!userCategoryMappingRepo.existsByKeywordAndUser(keyword, user))
        {
            Category category = categoryRepo.findById(categoryId)
                    .orElseThrow(() -> new NotFoundException("Category not found"));
            UserCategoryMapping categoryMapping = new UserCategoryMapping();
            categoryMapping.setCategory(category);
            categoryMapping.setUser(user);
            categoryMapping.setKeyword(keyword);
            userCategoryMappingRepo.save(categoryMapping);
        }
    }

    public void saveMappingsBulk(User user, List<KeywordMappingDTO> mappings)
    {
        Set<String> existingKeywords = userCategoryMappingRepo.findAllByUser(user)
                .stream()
                .map(UserCategoryMapping::getKeyword)
                .collect(Collectors.toSet());

        List<Integer> categoryIds = mappings.stream()
                .map(KeywordMappingDTO::getCategoryId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Map<Integer, Category> categoryMap = categoryRepo.findAllById(categoryIds)
                .stream()
                .collect(Collectors.toMap(Category::getCategoryId, c -> c));

        List<UserCategoryMapping> newMappings = new ArrayList<>();

        for (var mapping : mappings)
        {
            if (mapping.getKeyword() == null || mapping.getCategoryId() == null) continue;
            if (existingKeywords.contains(mapping.getKeyword())) continue;

            Category category = categoryMap.get(mapping.getCategoryId());
            if (category == null) continue;

            UserCategoryMapping newMapping = new UserCategoryMapping();
            newMapping.setUser(user);
            newMapping.setKeyword(mapping.getKeyword());
            newMapping.setCategory(category);

            newMappings.add(newMapping);
            existingKeywords.add(mapping.getKeyword());
        }

        userCategoryMappingRepo.saveAll(newMappings);
    }
}

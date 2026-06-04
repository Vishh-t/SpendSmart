package org.example.expense_manager.Service;


import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.example.expense_manager.DTO.ServiceDTOs.ParsedTransactionDTO;
import org.example.expense_manager.Entity.Category;
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
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ImportService
{
    @Value("${gemini.api.key}")
    private String api_key;

    @Value("${gemini.api.url}")
    private String api_url;

    final private ExpenseRepo expenseRepo;

    final private CategoryRepo categoryRepo;

    final private UserCategoryMappingRepo userCategoryMappingRepo;

    final private RestTemplate template;

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
        } catch (Exception ex)
        {
            throw new AppException("Could not read PDF");
        }
    }

    private String stripSensitiveData(String text)
    {
        String stripped = text.replaceAll("\\b\\d{10,16}\\b", "[REMOVED]").replaceAll("[A-Z]{4}0[A-Z0-9]{6}", "[REMOVED]");
        System.out.println("Stripped text: " + stripped);
        return stripped;
    }

    private String normalizeKeyword(String rawVendor)
    {
        return rawVendor.toLowerCase().replaceAll("\\b(pvt|ltd|private|limited|india|payment|services|enterprise|enterprises)\\b", "").replaceAll("\\s+", " ").trim();
    }

    private boolean isDuplicate(User user, BigDecimal amount, String keyword, LocalDateTime dateTime)
    {
        if (keyword == null) return false;

        System.out.println("Checking duplicate: amount=" + amount + " keyword=" + keyword + " dateTime=" + dateTime);

        return expenseRepo.existsByUserAndAmountAndKeywordAndExpenseTimestamp(user, amount, keyword, dateTime);
    }

    private String callGemini(List<Category> categoryList, String statementText, boolean includeCredits)
    {

        // converting the content of a page into one string
        StringBuilder categories = new StringBuilder();

        for (Category category : categoryList)
        {
            categories.append(category.getCategoryId() + " : " + category.getCategoryName() + "\n");
        }

        // chunking pages

        String[] pages = statementText.split("\f");

        StringBuilder text = new StringBuilder();

        StringBuilder allResponses = new StringBuilder();

        ObjectMapper mapper = new ObjectMapper();

        for (int i = 0; i < pages.length; i = i + 5)
        {
            for (int j = i; j < i + 5 && j < pages.length; j++)
            {
                text.append(pages[j]);
            }

            // changing the prompt
            String finalPrompt = GEMINI_PROMPT.replace("{categoryList}", categories.toString()).replace("{includeCredits}", String.valueOf(includeCredits)).replace("{statementText}", text);

            // building the standard response body
            Map<String, Object> part = new HashMap<>();
            part.put("text", finalPrompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(part));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(content));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String responseBody = template.postForObject(api_url + "?key=" + api_key, entity, String.class);
            System.out.println("Gemini raw response: " + responseBody);

            try
            {
                JsonNode root = mapper.readTree(responseBody);
                String chunkTransactions = root.path("candidates").get(0)
                        .path("content")
                        .path("parts").get(0)
                        .path("text").textValue();
                if (chunkTransactions != null)
                {
                    allResponses.append(chunkTransactions);
                }
            } catch (Exception e)
            {
                throw new AppException("Gemini API call failed: " + e.getMessage());
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

            String mergedJSON = rawResponse.replace("][", ",");

            JsonNode transactions = mapper.readTree(mergedJSON);

            List<ParsedTransactionDTO> results = new ArrayList<>();

            for (JsonNode transaction : transactions)
            {
                String description = transaction.path("description").textValue();

                Integer categoryId = transaction.path("categoryId").isNull() ? null : transaction.path("categoryId").intValue();

                Double confidenceScore = transaction.path("confidenceScore").doubleValue();

                String rawAmount = transaction.path("amount").toString();
                rawAmount = rawAmount.replaceAll("[^0-9.]", "");
                BigDecimal amount = new BigDecimal(rawAmount);

                String rawDate = transaction.path("date").textValue();
                String rawTime = transaction.path("time").textValue();

                LocalDateTime dateTime;
                if (rawTime != null)
                {
                    dateTime = LocalDateTime.parse(rawDate + "T" + rawTime + ":00");
                }
                else
                {
                    dateTime = LocalDate.parse(rawDate).atStartOfDay();
                }

                String keyword = normalizeKeyword(transaction.path("vendor").textValue());

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
        } catch (Exception e)
        {
            throw new AppException("Failed to parse Gemini response");
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

    public List<ParsedTransactionDTO> parseStatement(User user, MultipartFile file, boolean includeCredits)
    {
        String text = extractTextFromPdf(file);
        String strippedText = stripSensitiveData(text);

        List<Category> categories = categoryRepo.findAll();

        String rawStatements = callGemini(categories, strippedText, includeCredits);

        List<ParsedTransactionDTO> statements = parseGeminiResponse(rawStatements);

        List<ParsedTransactionDTO> parsedStatements = applyUserMappings(user, statements);

        for (var trans : parsedStatements)
        {
            if (isDuplicate(user, trans.getAmount(), trans.getKeyword(), trans.getDateTime()))
            {
                trans.setDuplicate(true);
            }
        }

        return parsedStatements;
    }

    public void saveMapping(User user, String keyword, Integer categoryId)
    {
        if (!userCategoryMappingRepo.existsByKeywordAndUser(keyword, user))
        {
            Category category = categoryRepo.findById(categoryId).orElseThrow(() -> new NotFoundException("Category not found "));
            UserCategoryMapping categoryMapping = new UserCategoryMapping();
            categoryMapping.setCategory(category);
            categoryMapping.setUser(user);
            categoryMapping.setKeyword(keyword);
            userCategoryMappingRepo.save(categoryMapping);
        }

    }
}

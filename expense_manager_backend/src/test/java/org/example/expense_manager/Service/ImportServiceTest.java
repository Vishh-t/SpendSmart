package org.example.expense_manager.Service;


import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class ImportServiceTest
{
    private final ImportService importService = new ImportService(null, null, null, null, null, null);

    @Test
    void normalizeKeyword_removesCompanySuffix()
    {

        String rawVendor = "Swiggy pvt ltd ";

        String result = importService.normalizeKeyword(rawVendor);

        assertEquals("swiggy", result);
    }

    @Test
    void normalizeKeyword_removeExtraWhiteSpaces()
    {
        String rawVendor = " Amazon   LtD";

        String result = importService.normalizeKeyword(rawVendor);

        assertEquals("amazon", result);
    }

    @Test
    void normalizeKeyword_alreadyCleanInputIsUnchanged()
    {

        String rawVendor = "zomato";

        String result = importService.normalizeKeyword(rawVendor);

        assertEquals("zomato", result);
    }


}

package org.example.expense_manager.Service;

import org.example.expense_manager.DTO.ServiceDTOs.*;
import org.example.expense_manager.Entity.*;
import org.example.expense_manager.Repository.ExpenseRepo;
import org.example.expense_manager.Repository.DismissedSubscriptionRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Month;
import java.time.YearMonth;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InsightsServiceTest {

    @Mock
    private ExpenseRepo expenseRepo;

    @Mock
    private DismissedSubscriptionRepo dismissedSubscriptionRepo;

    private InsightsService insightsService;

    private User testUser;

    @BeforeEach
    void setUp() {
        insightsService = new InsightsService(expenseRepo, dismissedSubscriptionRepo);
        
        testUser = new User();
        testUser.setUserId(1);
        testUser.setUsername("testuser");
        testUser.setMonthlyBudget(BigDecimal.valueOf(10000));
    }

    @Test
    void anomalyDetector_whenCurrentMonthSpikeAbove2Sigma_returnsAnomaly() {
        List<Expense> expenses = List.of(
            expense("Food", 1000, Month.JANUARY, 2026),
            expense("Food", 1100, Month.FEBRUARY, 2026),
            expense("Food", 1050, Month.MARCH, 2026),
            expense("Food", 5000, Month.APRIL, 2026)
        );
        when(expenseRepo.findAllByUser(testUser)).thenReturn(expenses);

        List<AnomalyDTO> anomalies = insightsService.anomalyDetector(testUser, 4, 2026);

        assertThat(anomalies).hasSize(1);
        AnomalyDTO anomaly = anomalies.getFirst();
        assertThat(anomaly.getCategoryName()).isEqualTo("Food");
        assertThat(anomaly.getSeverity()).isEqualTo("Unusual");
        assertThat(anomaly.getDeviationMultiple()).isGreaterThan(new BigDecimal("3"));
        assertThat(anomaly.isInsufficientData()).isFalse();
    }

    @Test
    void anomalyDetector_whenInsufficientHistoricalData_returnsInsufficientDataFlag() {
        List<Expense> expenses = List.of(
            expense("Food", 1000, Month.MARCH, 2026),
            expense("Food", 5000, Month.APRIL, 2026)
        );
        when(expenseRepo.findAllByUser(testUser)).thenReturn(expenses);

        List<AnomalyDTO> anomalies = insightsService.anomalyDetector(testUser, 4, 2026);

        assertThat(anomalies).hasSize(1);
        assertThat(anomalies.getFirst().isInsufficientData()).isTrue();
        assertThat(anomalies.getFirst().getSeverity()).isEqualTo("INSUFFICIENT_DATA");
    }

    @Test
    void anomalyDetector_whenNoSpike_returnsEmptyList() {
        List<Expense> expenses = List.of(
            expense("Food", 1000, Month.JANUARY, 2026),
            expense("Food", 1050, Month.FEBRUARY, 2026),
            expense("Food", 980, Month.MARCH, 2026),
            expense("Food", 1020, Month.APRIL, 2026)
        );
        when(expenseRepo.findAllByUser(testUser)).thenReturn(expenses);

        List<AnomalyDTO> anomalies = insightsService.anomalyDetector(testUser, 4, 2026);

        assertThat(anomalies).isEmpty();
    }

    @Test
    void merchantLeaderboard_ranksByTotalSpendDescending() {
        List<Expense> expenses = List.of(
            expense("swiggy", 5000, Month.JANUARY, 2026),
            expense("swiggy", 3000, Month.FEBRUARY, 2026),
            expense("netflix", 500, Month.JANUARY, 2026),
            expense("uber", 2000, Month.JANUARY, 2026)
        );
        when(expenseRepo.findAllByUser(testUser)).thenReturn(expenses);

        List<MerchantDTO> leaderboard = insightsService.merchantLeaderboard(testUser);

        assertThat(leaderboard).hasSize(3);
        assertThat(leaderboard.getFirst().getKeyword()).isEqualTo("swiggy");
        assertThat(leaderboard.get(0).getRank()).isEqualTo(1);
        assertThat(leaderboard.get(0).getTotalSpent()).isEqualByComparingTo("8000");
        assertThat(leaderboard.get(1).getKeyword()).isEqualTo("uber");
        assertThat(leaderboard.get(2).getKeyword()).isEqualTo("netflix");
    }

    @Test
    void merchantLeaderboard_calculatesPercentageCorrectly() {
        List<Expense> expenses = List.of(
            expense("swiggy", 8000, Month.JANUARY, 2026),
            expense("uber", 2000, Month.JANUARY, 2026)
        );
        when(expenseRepo.findAllByUser(testUser)).thenReturn(expenses);

        List<MerchantDTO> leaderboard = insightsService.merchantLeaderboard(testUser);

        assertThat(leaderboard.get(0).getPercentage()).isEqualByComparingTo("80.00");
        assertThat(leaderboard.get(1).getPercentage()).isEqualByComparingTo("20.00");
    }

    @Test
    void subscriptionTracker_detectsMonthlySubscription() {
        // Use dates exactly 31 days apart: Jan 1, Feb 1, Mar 3, Apr 3 (Jan has 31 days, Feb has 28, Mar has 31)
        // Better: use months with 31 days consistently
        List<Expense> expenses = List.of(
            expense("netflix", 499, LocalDateTime.of(2026, 1, 1, 12, 0)),   // Jan 1
            expense("netflix", 499, LocalDateTime.of(2026, 2, 1, 12, 0)),   // Feb 1 (31 days later)
            expense("netflix", 499, LocalDateTime.of(2026, 3, 3, 12, 0)),   // Mar 3 (28 days later in 2026)
            expense("netflix", 499, LocalDateTime.of(2026, 4, 3, 12, 0))    // Apr 3 (31 days later)
        );
        when(expenseRepo.findAllByUser(testUser)).thenReturn(expenses);
        when(dismissedSubscriptionRepo.findAllByUser(testUser)).thenReturn(Collections.emptyList());

        List<RecurringExpenseDTO> subscriptions = insightsService.subscriptionTracker(testUser);

        assertThat(subscriptions).hasSize(1);
        RecurringExpenseDTO sub = subscriptions.getFirst();
        assertThat(sub.getKeyword()).isEqualTo("netflix");
        assertThat(sub.getAverageAmount()).isEqualByComparingTo("499");
        // Average gap: (31 + 28 + 31) / 3 = 30
        assertThat(sub.getAverageGap()).isEqualTo(30);
    }

    @Test
    void subscriptionTracker_ignoresVariableAmounts() {
        List<Expense> expenses = List.of(
            expense("aws", 100, LocalDateTime.of(2026, 1, 1, 12, 0)),
            expense("aws", 500, LocalDateTime.of(2026, 2, 1, 12, 0)),
            expense("aws", 50, LocalDateTime.of(2026, 3, 3, 12, 0)),
            expense("aws", 800, LocalDateTime.of(2026, 4, 3, 12, 0))
        );
        when(expenseRepo.findAllByUser(testUser)).thenReturn(expenses);
        when(dismissedSubscriptionRepo.findAllByUser(testUser)).thenReturn(Collections.emptyList());

        List<RecurringExpenseDTO> subscriptions = insightsService.subscriptionTracker(testUser);

        assertThat(subscriptions).isEmpty();
    }

    @Test
    void subscriptionTracker_ignoresTooFewOccurrences() {
        List<Expense> expenses = List.of(
            expense("spotify", 129, LocalDateTime.of(2026, 3, 1, 12, 0)),
            expense("spotify", 129, LocalDateTime.of(2026, 4, 1, 12, 0))
        );
        when(expenseRepo.findAllByUser(testUser)).thenReturn(expenses);
        when(dismissedSubscriptionRepo.findAllByUser(testUser)).thenReturn(Collections.emptyList());

        List<RecurringExpenseDTO> subscriptions = insightsService.subscriptionTracker(testUser);

        assertThat(subscriptions).isEmpty();
    }

    @Test
    void dailyBurnRate_calculatesEWMA() {
        LocalDateTime startOfMonth = YearMonth.now().atDay(1).atStartOfDay();
        
        List<Expense> expenses = List.of(
            expense("Food", 500, startOfMonth.plusDays(1)),
            expense("Transport", 300, startOfMonth.plusDays(2)),
            expense("Shopping", 1000, startOfMonth.plusDays(5))
        );
        
        when(expenseRepo.findAllByUserAndExpenseTimestampBetween(eq(testUser), eq(startOfMonth), any(LocalDateTime.class)))
            .thenReturn(expenses);

        BurnRateDTO burnRate = insightsService.dailyBurnRate(testUser);

        assertThat(burnRate.getDailyBurnRate()).isGreaterThan(BigDecimal.ZERO);
        assertThat(burnRate.getStatus()).isIn("ON_TRACK", "WARNING", "EXCEEDED");
        assertThat(burnRate.getDaysUntilBudgetExhausted()).isGreaterThanOrEqualTo(0);
    }

    @Test
    void monthlyDelta_calculatesTrendsCorrectly() {
        YearMonth target = YearMonth.of(2026, 4); // April 2026
        YearMonth previous = YearMonth.of(2026, 3); // March 2026
        
        LocalDateTime targetStart = target.atDay(1).atStartOfDay();
        LocalDateTime targetEnd = target.atEndOfMonth().atTime(LocalTime.MAX);
        LocalDateTime prevStart = previous.atDay(1).atStartOfDay();
        LocalDateTime prevEnd = previous.atEndOfMonth().atTime(LocalTime.MAX);

        List<Expense> targetExpenses = List.of(
            expense("Food", 3000, Month.APRIL, 2026),
            expense("Transport", 1000, Month.APRIL, 2026)
        );
        List<Expense> prevExpenses = List.of(
            expense("Food", 2000, Month.MARCH, 2026),
            expense("Transport", 1500, Month.MARCH, 2026),
            expense("Entertainment", 500, Month.MARCH, 2026)
        );

        when(expenseRepo.findAllByUserAndExpenseTimestampBetween(eq(testUser), eq(targetStart), eq(targetEnd)))
            .thenReturn(targetExpenses);
        when(expenseRepo.findAllByUserAndExpenseTimestampBetween(eq(testUser), eq(prevStart), eq(prevEnd)))
            .thenReturn(prevExpenses);

        List<MonthlyDeltaDTO> deltas = insightsService.monthlyDelta(testUser, 4, 2026, 3, 2026);

        assertThat(deltas).hasSize(3);
        
        MonthlyDeltaDTO food = deltas.stream().filter(d -> d.getCategory().equals("Food")).findFirst().orElseThrow();
        assertThat(food.getTrend()).isEqualTo("UP");
        assertThat(food.getDeltaPercentage()).isEqualByComparingTo("50.00");
        
        MonthlyDeltaDTO transport = deltas.stream().filter(d -> d.getCategory().equals("Transport")).findFirst().orElseThrow();
        assertThat(transport.getTrend()).isEqualTo("DOWN");
        
        MonthlyDeltaDTO entertainment = deltas.stream().filter(d -> d.getCategory().equals("Entertainment")).findFirst().orElseThrow();
        assertThat(entertainment.getTrend()).isEqualTo("GONE");
    }

    @Test
    void weeklyDNA_groupsByDayOfWeek() {
        List<Expense> expenses = List.of(
            expense("Food", 500, LocalDateTime.of(2026, 1, 5, 12, 0)),   // Monday
            expense("Food", 300, LocalDateTime.of(2026, 1, 6, 12, 0)),   // Tuesday
            expense("Transport", 1000, LocalDateTime.of(2026, 1, 10, 12, 0)) // Saturday
        );
        

        when(expenseRepo.findAllByUserAndExpenseTimestampBetween(eq(testUser), any(LocalDateTime.class), any(LocalDateTime.class)))
            .thenReturn(expenses);

        List<WeeklyDNADTO> dna = insightsService.weeklyDNA(testUser, null);

        assertThat(dna).hasSize(3);
        assertThat(dna).extracting(WeeklyDNADTO::getDay)
            .containsExactlyInAnyOrder(
                java.time.DayOfWeek.MONDAY, 
                java.time.DayOfWeek.TUESDAY, 
                java.time.DayOfWeek.SATURDAY
            );
    }


    private Expense expense(String keyword, double amount, Month month, int year) {
        return expense(keyword, amount, LocalDateTime.of(year, month, 15, 12, 0));
    }

    private Expense expense(String keyword, double amount, LocalDateTime timestamp) {
        Expense e = new Expense();
        e.setKeyword(keyword);
        e.setAmount(BigDecimal.valueOf(amount));
        e.setExpenseTimestamp(timestamp);
        
        // Category is REQUIRED (non-null) for anomalyDetector, monthlyDelta, weeklyDNA
        Category cat = new Category();
        cat.setCategoryId(1);
        cat.setCategoryName(keyword.substring(0, 1).toUpperCase() + keyword.substring(1));
        cat.setUser(testUser);
        e.setCategory(cat);
        
        e.setUser(testUser);
        return e;
    }
}
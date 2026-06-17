package org.example.expense_manager.DTO.ServiceDTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InsightsSummaryDTO
{
    private BurnRateDTO dailyBurnRate;
    private List<AnomalyDTO> anomalies;
    private List<MerchantDTO> merchantLeaderboard;
    private List<RecurringExpenseDTO> subscriptionTracker;
    private List<WeeklyDNADTO> weeklyDNA;
    private List<MonthlyDeltaDTO> monthlyDelta;
}

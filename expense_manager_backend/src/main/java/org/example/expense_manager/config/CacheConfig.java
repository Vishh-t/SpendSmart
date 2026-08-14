package org.example.expense_manager.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class CacheConfig
{
    @Bean
    public CaffeineCacheManager cacheManager()
    {
        CaffeineCacheManager manager = new CaffeineCacheManager(
                "financialSummary", "budgetStatus", "dashboardSummary" , "annualSummary"
        );
        manager.setCaffeine(
                Caffeine.newBuilder()
                        .expireAfterWrite(2, TimeUnit.MINUTES)
                        .maximumSize(500)
        );
        return manager;
    }
}

package org.example.expense_manager.Controller;

import lombok.RequiredArgsConstructor;
import org.example.expense_manager.Entity.User;
import org.example.expense_manager.Service.InsightsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;

@RestController
@RequestMapping("/insights")
@RequiredArgsConstructor
public class InsightsController
{
    private final InsightsService service;

    @GetMapping("/anomalyDetector")
    public ResponseEntity<?> anomalyDetector(@RequestParam(required = false) Integer year, @RequestParam(required = false) Integer month)
    {
        User loggedinUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.anomalyDetector(loggedinUser, month, year), HttpStatus.OK);
    }

    @GetMapping("/merchantLeaderboard")
    public ResponseEntity<?> merchantLeaderBoard()
    {
        User loggedinUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.merchantLeaderboard(loggedinUser), HttpStatus.OK);
    }

    @GetMapping("/subscriptionTracker")
    public ResponseEntity<?> subscriptionTracker()
    {
        User loggedinUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.subscriptionTracker(loggedinUser), HttpStatus.OK);
    }

    @GetMapping("/weeklyDNA")
    public ResponseEntity<?> weeklyDNA(@RequestParam(required = false) Integer months)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.weeklyDNA(loggedInUser, months), HttpStatus.OK);
    }

    @GetMapping("/dailyBurnRate")
    public ResponseEntity<?> dailyBurnRate()
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.dailyBurnRate(loggedInUser), HttpStatus.OK);
    }

    @GetMapping("/monthlyDelta")
    public ResponseEntity<?> monthlyDelta(@RequestParam(required = false) Integer month1, @RequestParam(required = false) Integer month2, @RequestParam(required = false) Integer year1, @RequestParam(required = false) Integer year2)
    {
        User loggedInUser = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        return new ResponseEntity<>(service.monthlyDelta(loggedInUser, month1, year1, month2, year2), HttpStatus.OK);
    }

}

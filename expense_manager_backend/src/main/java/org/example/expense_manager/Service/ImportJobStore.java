package org.example.expense_manager.Service;

import org.example.expense_manager.DTO.ServiceDTOs.ImportJobStatusDTO;
import org.example.expense_manager.DTO.ServiceDTOs.ParsedTransactionDTO;
import org.example.expense_manager.Exceptions.NotFoundException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ImportJobStore
{
    private final Map<String, ImportJobStatusDTO> jobs = new ConcurrentHashMap<>();

    public String createJob()
    {
        String jobId = UUID.randomUUID().toString();
        jobs.put(jobId, new ImportJobStatusDTO("PROCESSING", null, null));
        return jobId;
    }

    public void markDone(String jobId, List<ParsedTransactionDTO> result)
    {
        jobs.put(jobId, new ImportJobStatusDTO("DONE", result, null));
    }

    public void markFailed(String jobId, String error)
    {
        jobs.put(jobId, new ImportJobStatusDTO("FAILED", null, error));
    }

    public ImportJobStatusDTO getStatus(String jobId)
    {
        ImportJobStatusDTO status = jobs.get(jobId);
        if (status == null) throw new NotFoundException("Job not found");
        return status;
    }
}

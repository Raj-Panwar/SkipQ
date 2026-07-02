package com.skipq.backend.service;

import com.skipq.backend.entity.OrderItem;
import com.skipq.backend.repository.OrderItemRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FileCleanupService {

    private final OrderItemRepository orderItemRepository;
    private final FileStorageService fileStorageService;
    

    public FileCleanupService(
            OrderItemRepository orderItemRepository,
            FileStorageService fileStorageService) {

        this.orderItemRepository = orderItemRepository;
        this.fileStorageService = fileStorageService;
    }
    

    @Scheduled(cron = "0 * * * * *")
public void deleteOldFiles() {

    System.out.println("===== Running file cleanup =====");

    LocalDateTime cutoff = LocalDateTime.now().minusMinutes(1);

    System.out.println("Cutoff: " + cutoff);

    List<OrderItem> oldItems =
            orderItemRepository.findByUploadedAtBefore(cutoff);

    System.out.println("Found items: " + oldItems.size());

    for (OrderItem item : oldItems) {

        System.out.println("Processing: " + item.getFileName());

        if (item.getFileName() == null) {
            continue;
        }

        try {

            fileStorageService.deleteFile(item.getFileName());

            System.out.println("Deleted!");

            item.setFileName(null);
            orderItemRepository.save(item);

        } catch (Exception e) {

            e.printStackTrace();

        }
    }
}
}

package com.skipq.backend.controller;

import com.skipq.backend.dto.CreateOrderRequest;
import com.skipq.backend.dto.PreLoginQueueDTO;
import com.skipq.backend.dto.QueueInfoDTO;
import com.skipq.backend.security.AppUserPrincipal;
import com.skipq.backend.service.OrderService;
import com.skipq.backend.exception.OrderNotFoundException;
import com.skipq.backend.dto.WaitEstimateDTO;
import com.skipq.backend.dto.order.OrderResponse;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.skipq.backend.exception.NoActiveOrderException;
import com.skipq.backend.exception.OrderCancellationException;
import java.util.Map;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin("*")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @AuthenticationPrincipal AppUserPrincipal admin,

            @PathVariable Long id,

            @RequestParam String status) {

        OrderResponse updatedOrder = orderService.updateStatus(id, admin.getCollegeId(), status);

        return ResponseEntity.ok(updatedOrder);
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(
            @AuthenticationPrincipal AppUserPrincipal student,
            @PathVariable Long id) {

        try {

            OrderResponse cancelledOrder = orderService.cancelOrder(id, student.getId());

            return ResponseEntity.ok(cancelledOrder);

        } catch (OrderNotFoundException ex) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", ex.getMessage()));

        } catch (OrderCancellationException ex) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @AuthenticationPrincipal AppUserPrincipal student,
            @Valid @RequestBody CreateOrderRequest request) {

        // The authenticated student's id always wins, regardless of what
        // (if anything) the client put in the request body.
        request.setStudentId(student.getId());

        OrderResponse order = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<OrderResponse> getAllOrders(
            @AuthenticationPrincipal AppUserPrincipal admin) {

        return orderService.getAllOrders(admin.getCollegeId());
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/wait-estimate")
    public WaitEstimateDTO getCurrentWaitEstimate(
            @AuthenticationPrincipal AppUserPrincipal student) {

        return orderService.getCurrentWaitEstimate(student.getId());
    }

    @PreAuthorize("hasAnyRole('STUDENT','ADMIN')")
    @GetMapping("/{id:\\d+}")
    public OrderResponse getOrderById(
        @AuthenticationPrincipal AppUserPrincipal principal,
        @PathVariable Long id) {

    return orderService.getOrderById(id, principal);
}

    @PreAuthorize("hasAnyRole('STUDENT','ADMIN')")
    @GetMapping("/{id:\\d+}/queue")
    public QueueInfoDTO getQueueInfo(
        @AuthenticationPrincipal AppUserPrincipal principal,
        @PathVariable Long id) {

    return orderService.getQueueInfo(id, principal);
}

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/student/me")
    public List<OrderResponse> getStudentOrders(
            @AuthenticationPrincipal AppUserPrincipal student) {
        return orderService.getOrdersByStudent(student.getId());
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/student/me/active")
    public OrderResponse getActiveOrder(
            @AuthenticationPrincipal AppUserPrincipal student) {

        return orderService.getActiveOrder(student.getId());
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/queue/current-serving")
    public Integer getCurrentServingToken(
            @AuthenticationPrincipal AppUserPrincipal student) {

        return orderService.getCurrentServingToken(student.getId());
    }

    @GetMapping("/queue/college/{collegeCode}")
    public PreLoginQueueDTO getPreLoginQueue(
            @PathVariable String collegeCode) {

        return orderService.getPreLoginQueueByCollegeCode(collegeCode);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/search")
    public Page<OrderResponse> searchOrders(

            @AuthenticationPrincipal AppUserPrincipal admin,

            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,

            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return orderService.searchOrders(
                admin.getCollegeId(),
                query,
                status,
                date,
                sort,
                page,
                size);
    }
}
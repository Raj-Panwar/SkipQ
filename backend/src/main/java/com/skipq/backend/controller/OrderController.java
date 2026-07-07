package com.skipq.backend.controller;

import com.skipq.backend.service.AdminService;
import com.skipq.backend.dto.CreateOrderRequest;
import com.skipq.backend.dto.QueueInfoDTO;
import com.skipq.backend.entity.Order;
import com.skipq.backend.service.OrderService;
import com.skipq.backend.exception.OrderNotFoundException;
import com.skipq.backend.dto.WaitEstimateDTO;
import com.skipq.backend.dto.order.OrderResponse;
import com.skipq.backend.dto.order.OrderResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.skipq.backend.exception.OrderCancellationException;
import java.util.Map;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin("*")
public class OrderController {
    private final AdminService adminService;

    private final OrderService orderService;

    public OrderController(OrderService orderService,
                       AdminService adminService) {
    this.orderService = orderService;
    this.adminService = adminService;
}

    @PatchMapping("/{id}/status")
public ResponseEntity<OrderResponse> updateStatus(

        @RequestHeader("X-Admin-Id") Long adminId,

        @PathVariable Long id,

        @RequestParam String status) {

    Long collegeId = adminService
            .getById(adminId)
            .getCollege()
            .getId();

    OrderResponse updatedOrder = orderService.updateStatus(id, collegeId, status);

    return ResponseEntity.ok(updatedOrder);
}

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(
            @PathVariable Long id,
            @RequestParam Long studentId) {

        try {

            OrderResponse cancelledOrder = orderService.cancelOrder(id, studentId);

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

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {

        OrderResponse order = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping
    public List<OrderResponse> getAllOrders() {
        return orderService.getAllOrders(null);
    }

    @GetMapping("/wait-estimate")
    public WaitEstimateDTO getCurrentWaitEstimate() {
        return orderService.getCurrentWaitEstimate();
    }

    @GetMapping("/{id:\\d+}")
    public OrderResponse getOrderById(@PathVariable Long id) {
        return orderService.getOrderById(id);
    }

    @GetMapping("/{id:\\d+}/queue")
    public QueueInfoDTO getQueueInfo(@PathVariable Long id) {
        return orderService.getQueueInfo(id);
    }

    @GetMapping("/student/{studentId}")
    public List<OrderResponse> getStudentOrders(@PathVariable Long studentId) {
        return orderService.getOrdersByStudent(studentId);
    }

    @GetMapping("/queue/current-serving")
    public Integer getCurrentServingToken() {

        return orderService.getCurrentServingToken();

    }

    @GetMapping("/search")
public Page<OrderResponse> searchOrders(

        @RequestHeader("X-Admin-Id") Long adminId,

        @RequestParam(required = false) String query,
        @RequestParam(required = false) String status,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate date,

        @RequestParam(defaultValue = "newest") String sort,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {

    Long collegeId = adminService
            .getById(adminId)
            .getCollege()
            .getId();

    return orderService.searchOrders(
            collegeId,
            query,
            status,
            date,
            sort,
            page,
            size);
}
}

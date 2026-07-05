package com.skipq.backend.service;

import com.skipq.backend.entity.Student;
import com.skipq.backend.exception.OrderCancellationException;
import com.skipq.backend.repository.StudentRepository;
import com.skipq.backend.dto.CreateOrderItemRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import com.skipq.backend.exception.OrderCancellationException;
import com.skipq.backend.exception.OrderNotFoundException;
import com.skipq.backend.dto.CreateOrderRequest;
import com.skipq.backend.dto.QueueInfoDTO;
import com.skipq.backend.entity.Order;
import com.skipq.backend.entity.OrderItem;
import com.skipq.backend.dto.WaitEstimateDTO;
import com.skipq.backend.entity.Product;
import com.skipq.backend.repository.OrderRepository;
import com.skipq.backend.repository.OrderSpecifications;
import com.skipq.backend.repository.ProductRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final StudentRepository studentRepository;
    private final NotificationService notificationService;
    private final WaitTimeService waitTimeService;

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            StudentRepository studentRepository,
            NotificationService notificationService,
            WaitTimeService waitTimeService) {

        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.studentRepository = studentRepository;
        this.notificationService = notificationService;
        this.waitTimeService = waitTimeService;

    }

    @Transactional
    public Order updateStatus(Long id, String status) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        String previousStatus = order.getStatus();

        // Prevent duplicate updates and notifications
        if (status.equals(previousStatus)) {
            return order;
        }

        order.setStatus(status);

        LocalDateTime now = LocalDateTime.now();

        switch (status) {
            case "PREPARING":
                if (order.getPreparingAt() == null) {
                    order.setPreparingAt(now);
                }
                break;

            case "READY":
                if (order.getReadyAt() == null) {
                    order.setReadyAt(now);
                }

                waitTimeService.invalidateCache();
                break;

            case "COMPLETED":
                if (order.getCompletedAt() == null) {
                    order.setCompletedAt(now);
                }
                break;
        }
        Order saved = orderRepository.save(order);

        notificationService.notifyStatusChange(saved, status);

        return saved;
    }

    @Transactional
    public Order cancelOrder(Long orderId, Long studentId) {

        Order order = orderRepository.findByIdAndStudentId(orderId, studentId)
                .orElseThrow(() -> new OrderNotFoundException(
                        "Order not found or does not belong to the student"));
        if (!"PLACED".equals(order.getStatus())) {
            throw new OrderCancellationException(
                    "Only placed orders can be cancelled.");
        }

        // Restore Stock
        for (OrderItem item : order.getItems()) {

            if (!"stationery".equals(item.getItemType())) {
                continue;
            }

            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new RuntimeException(
                            "Product not found: " + item.getProductId()));

            product.setStock(
                    product.getStock() + item.getQuantity());

            productRepository.save(product);
        }
        order.setStatus("CANCELLED");

        Order cancelledOrder = orderRepository.save(order);
        notificationService.notifyStatusChange(
                cancelledOrder,
                "CANCELLED");

        return cancelledOrder;
    }

    @Transactional
    public Order createOrder(CreateOrderRequest request) {

        Order order = new Order();

        if (request.getStudentId() != null) {

            Student student = studentRepository.findById(request.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            order.setStudent(student);

            order.setStudentName(student.getFullName());

        } else {

            order.setStudentName(
                    request.getStudentName() != null
                            ? request.getStudentName()
                            : "Guest");
        }

        order.setStatus("PLACED");

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CreateOrderItemRequest itemRequest : request.getItems()) {

            if ("print".equals(itemRequest.getItemType())) {

                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(order);

                orderItem.setItemType("print");
                orderItem.setFileName(itemRequest.getFileName());
                orderItem.setOriginalFileName(itemRequest.getOriginalFileName());
                orderItem.setPages(itemRequest.getPages());
                orderItem.setCopies(itemRequest.getCopies());
                orderItem.setColorMode(itemRequest.getColorMode());
                orderItem.setSided(itemRequest.getSided());
                orderItem.setPaperSize(itemRequest.getPaperSize());

                orderItem.setProductName("Print Job");
                orderItem.setQuantity(1);

                BigDecimal price = BigDecimal.valueOf(itemRequest.getTotalPrice());

                orderItem.setPrice(price);

                order.getItems().add(orderItem);

                totalAmount = totalAmount.add(price);

            } else {

                Product product = productRepository.findById(itemRequest.getProductId())
                        .orElseThrow(() -> new RuntimeException(
                                "Product not found with id: " + itemRequest.getProductId()));

                if (product.getStock() < itemRequest.getQuantity()) {
                    throw new RuntimeException(
                            "Insufficient stock for product: " + product.getName()
                                    + ". Available: " + product.getStock()
                                    + ", Requested: " + itemRequest.getQuantity());
                }

                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(order);

                orderItem.setItemType("stationery");
                orderItem.setProductId(product.getId());
                orderItem.setProductName(product.getName());
                orderItem.setQuantity(itemRequest.getQuantity());
                orderItem.setPrice(BigDecimal.valueOf(product.getPrice()));

                order.getItems().add(orderItem);

                BigDecimal lineTotal = BigDecimal.valueOf(product.getPrice())
                        .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

                totalAmount = totalAmount.add(lineTotal);

                product.setStock(product.getStock() - itemRequest.getQuantity());
                productRepository.save(product);
            }
        }
        // 6. Generate token
        Integer lastToken = orderRepository.findMaxTokenNumber();
        order.setTokenNumber(lastToken + 1);

        // 7. Set total and save Order — CascadeType.ALL saves OrderItems too
        order.setTotalAmount(totalAmount);
        return orderRepository.save(order);

    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Order not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public QueueInfoDTO getQueueInfo(Long orderId) {

        Order order = getOrderById(orderId);

        Integer currentServing = orderRepository.findCurrentServingToken();

        if (currentServing == null) {
            currentServing = order.getTokenNumber();
        }

        int peopleAhead = (int) orderRepository.countPeopleAhead(order.getTokenNumber());

        Double avgPrepMinutes = waitTimeService.getAveragePreparationMinutes();

        Integer estimatedWait = (avgPrepMinutes == null)
                ? null
                : (int) Math.ceil(peopleAhead * avgPrepMinutes);

        return new QueueInfoDTO(
                order.getTokenNumber(),
                order.getStatus(),
                currentServing,
                peopleAhead,
                estimatedWait);
    }

    @Transactional(readOnly = true)
    public WaitEstimateDTO getCurrentWaitEstimate() {

        long ordersAhead = orderRepository.countActiveOrders();

        Double avgPrepMinutes = waitTimeService.getAveragePreparationMinutes();

        Integer estimatedWait = (avgPrepMinutes == null)
                ? null
                : (int) Math.ceil(ordersAhead * avgPrepMinutes);

        return new WaitEstimateDTO(
                ordersAhead,
                estimatedWait);
    }

    @Transactional(readOnly = true)
    public Integer getCurrentServingToken() {

        return orderRepository.findCurrentServingToken();

    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersByStudent(Long studentId) {

        return orderRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
    }

    @Transactional(readOnly = true)
    public Page<Order> searchOrders(String query, String status, LocalDate date,
            String sort, int page, int size) {
        Specification<Order> spec = Specification
                .where(OrderSpecifications.matchesQuery(query))
                .and(OrderSpecifications.hasStatus(status))
                .and(OrderSpecifications.createdOnDate(date));

        Sort sortOrder = "oldest".equalsIgnoreCase(sort)
                ? Sort.by("createdAt").ascending()
                : Sort.by("createdAt").descending();

        Pageable pageable = PageRequest.of(page, size, sortOrder);
        Page<Order> result = orderRepository.findAll(spec, pageable);

        return orderRepository.findAll(spec, pageable);
    }
}
package com.skipq.backend.service;

import com.skipq.backend.entity.Student;
import com.skipq.backend.exception.NoActiveOrderException;
import com.skipq.backend.exception.OrderCancellationException;
import com.skipq.backend.repository.StudentRepository;
import com.skipq.backend.constants.InventoryConstants;
import com.skipq.backend.dto.CreateOrderItemRequest;
import com.skipq.backend.dto.college.CollegeResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import com.skipq.backend.exception.OrderNotFoundException;
import com.skipq.backend.dto.CreateOrderRequest;
import com.skipq.backend.dto.PreLoginQueueDTO;
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
import com.skipq.backend.mapper.OrderMapper;
import com.skipq.backend.dto.order.OrderResponse;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final StudentRepository studentRepository;
    private final NotificationService notificationService;
    private final WaitTimeService waitTimeService;
    private final CollegeService collegeService;
    private final OrderMapper orderMapper;
    private final TokenAllocationService tokenAllocationService;

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            StudentRepository studentRepository,
            NotificationService notificationService,
            WaitTimeService waitTimeService,
            CollegeService collegeService,
            TokenAllocationService tokenAllocationService,
            OrderMapper orderMapper) {

        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.studentRepository = studentRepository;
        this.notificationService = notificationService;
        this.waitTimeService = waitTimeService;
        this.collegeService = collegeService;
        this.orderMapper = orderMapper;
        this.tokenAllocationService = tokenAllocationService;

    }

    @Transactional
    public OrderResponse updateStatus(Long id,
            Long collegeId,
            String status) {

        Order order = orderRepository
                .findByIdAndCollegeId(id, collegeId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        String previousStatus = order.getStatus();

        // Prevent duplicate updates and notifications
        if (status.equals(previousStatus)) {
            return orderMapper.toResponse(order);
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

                waitTimeService.invalidateCache(order.getCollege().getId());
                break;

            case "COMPLETED":
                if (order.getCompletedAt() == null) {
                    order.setCompletedAt(now);
                }
                break;
        }
        Order saved = orderRepository.save(order);

        notificationService.notifyStatusChange(saved, status);

        return orderMapper.toResponse(saved);
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId, Long studentId) {

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
        notificationService.notifyOrderCancelled(cancelledOrder);


        return orderMapper.toResponse(cancelledOrder);
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {

        Order order = new Order();

        if (request.getStudentId() != null) {

            Student student = studentRepository.findById(request.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            order.setStudent(student);
            order.setCollege(student.getCollege());

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

                if (product.getStock() == 0) {
    

                    notificationService.notifyOutOfStock(product);

                } else if (product.getStock() <= InventoryConstants.LOW_STOCK_THRESHOLD) {
                    

                    notificationService.notifyLowStock(product);

                }
            }
        }
        // 6. Generate college-specific token
        // Generate college-specific token
        Integer token = tokenAllocationService.allocateNextToken(order.getCollege());

        order.setTokenNumber(token);
        // 7. Set total and save Order â€” CascadeType.ALL saves OrderItems too
        order.setTotalAmount(totalAmount);

        Order saved = orderRepository.save(order);

        notificationService.notifyNewOrder(saved);

        return orderMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders(Long collegeId) {
        return orderRepository
                .findAllByCollegeIdOrderByCreatedAtDesc(collegeId)
                .stream()
                .map(orderMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Order not found with id: " + id));

        return orderMapper.toResponse(order);
    }

    @Transactional(readOnly = true)
    public QueueInfoDTO getQueueInfo(Long orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        Long collegeId = order.getCollege().getId();

        Integer currentServing = orderRepository.findCurrentServingTokenByCollegeId(collegeId);

        if (currentServing == null) {
            currentServing = order.getTokenNumber();
        }

        int peopleAhead = (int) orderRepository.countPeopleAheadByCollegeId(
                collegeId,
                order.getTokenNumber());

        Double avgPrepMinutes = waitTimeService.getAveragePreparationMinutes(collegeId);

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
    public WaitEstimateDTO getCurrentWaitEstimate(Long studentId) {

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Long collegeId = student.getCollege().getId();

        long ordersAhead = orderRepository.countActiveOrdersByCollegeId(collegeId);

        Double avgPrepMinutes = waitTimeService.getAveragePreparationMinutes(collegeId);

        Integer estimatedWait = (avgPrepMinutes == null)
                ? null
                : (int) Math.ceil(ordersAhead * avgPrepMinutes);

        return new WaitEstimateDTO(
                ordersAhead,
                estimatedWait);
    }

    @Transactional(readOnly = true)
    public Integer getCurrentServingToken(Long studentId) {

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Long collegeId = student.getCollege().getId();

        return orderRepository.findCurrentServingTokenByCollegeId(collegeId);
    }

    @Transactional(readOnly = true)
    public PreLoginQueueDTO getPreLoginQueueByCollegeCode(String collegeCode) {

        CollegeResponse college = collegeService.getCollegeByCode(collegeCode);

        Integer currentServing = orderRepository.findCurrentServingTokenByCollegeId(college.getId());
        List<Integer> queueTokens = orderRepository.findActiveTokenNumbersByCollegeId(college.getId());

        return new PreLoginQueueDTO(currentServing, queueTokens);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByStudent(Long studentId) {

        return orderRepository
                .findByStudentIdOrderByCreatedAtDesc(studentId)
                .stream()
                .map(orderMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getActiveOrder(Long studentId) {

        List<Order> activeOrders = orderRepository.findActiveOrdersByStudentId(studentId);

        if (activeOrders.isEmpty()) {
            throw new NoActiveOrderException("No active order found.");
        }

        return orderMapper.toResponse(activeOrders.get(0));
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> searchOrders(
            Long collegeId,
            String query,
            String status,
            LocalDate date,
            String sort,
            int page,
            int size) {
        Specification<Order> spec = Specification
                .where(OrderSpecifications.belongsToCollege(collegeId))
                .and(OrderSpecifications.matchesQuery(query))
                .and(OrderSpecifications.hasStatus(status))
                .and(OrderSpecifications.createdOnDate(date));
        Sort sortOrder = "oldest".equalsIgnoreCase(sort)
                ? Sort.by("createdAt").ascending()
                : Sort.by("createdAt").descending();

        Pageable pageable = PageRequest.of(page, size, sortOrder);

        return orderRepository
                .findAll(spec, pageable)
                .map(orderMapper::toResponse);
    }
}
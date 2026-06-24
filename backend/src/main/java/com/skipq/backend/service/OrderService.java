package com.skipq.backend.service;

import com.skipq.backend.dto.CreateOrderItemRequest;
import com.skipq.backend.dto.CreateOrderRequest;
import com.skipq.backend.entity.Order;
import com.skipq.backend.entity.OrderItem;
import com.skipq.backend.entity.Product;
import com.skipq.backend.repository.OrderRepository;
import com.skipq.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository,
                        ProductRepository productRepository) {
        this.orderRepository   = orderRepository;
        this.productRepository = productRepository;
    }
    @Transactional
public Order updateStatus(Long id, String status) {

    Order order = orderRepository.findById(id)
            .orElseThrow(() ->
                    new RuntimeException("Order not found with id: " + id));

    order.setStatus(status);

    return orderRepository.save(order);
}

    @Transactional
    public Order createOrder(CreateOrderRequest request) {

        Order order = new Order();
        order.setStudentName(request.getStudentName());
        order.setStatus("PLACED");

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CreateOrderItemRequest itemRequest : request.getItems()) {

    if ("print".equals(itemRequest.getItemType())) {

        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(order);

        orderItem.setItemType("print");
        orderItem.setFileName(itemRequest.getFileName());
        orderItem.setPages(itemRequest.getPages());
        orderItem.setCopies(itemRequest.getCopies());
        orderItem.setColorMode(itemRequest.getColorMode());
        orderItem.setSided(itemRequest.getSided());
        orderItem.setPaperSize(itemRequest.getPaperSize());

        orderItem.setProductName("Print Job");
        orderItem.setQuantity(1);

        BigDecimal price =
                BigDecimal.valueOf(itemRequest.getTotalPrice());

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

        BigDecimal lineTotal =
                BigDecimal.valueOf(product.getPrice())
                        .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

        totalAmount = totalAmount.add(lineTotal);

        product.setStock(product.getStock() - itemRequest.getQuantity());
        productRepository.save(product);
    }
}
        // 6. Generate token
        long nextToken = orderRepository.count() + 1;
        order.setTokenNumber((int) nextToken);

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
}
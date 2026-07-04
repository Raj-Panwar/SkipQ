package com.skipq.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "student_id", nullable = false)
private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "order_id", nullable = false)
private Order order;

    

    @Column(nullable = false)
    private String type; // READY, COMPLETED, CANCELLED

    @Column(nullable = false, length = 255)
    private String message;

    @Column(name = "is_read", nullable = false)
private boolean read = false;

    @Column(nullable = false, updatable = false)
private LocalDateTime createdAt;

@PrePersist
protected void onCreate() {
    this.createdAt = LocalDateTime.now();
}

    public Notification() {}

    public Notification(Student student,
                    Order order,
                    String type,
                    String message) {
        this.student = student;
        this.order = order;
    
        this.type = type;
        this.message = message;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }



    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { read = read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
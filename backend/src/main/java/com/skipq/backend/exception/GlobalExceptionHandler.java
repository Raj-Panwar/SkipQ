package com.skipq.backend.exception;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(NoActiveOrderException.class)
        public ResponseEntity<Map<String, String>> handleNoActiveOrder(
                        NoActiveOrderException ex) {

                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(Map.of("message", ex.getMessage()));
        }

        @ExceptionHandler(NotificationNotFoundException.class)
        public ResponseEntity<Map<String, String>> handleNotificationNotFound(
                        NotificationNotFoundException ex) {

                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(Map.of("message", ex.getMessage()));
        }

        @ExceptionHandler(NotificationAccessDeniedException.class)
        public ResponseEntity<Map<String, String>> handleNotificationAccessDenied(
                        NotificationAccessDeniedException ex) {

                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("message", ex.getMessage()));
        }

        @ExceptionHandler(OtpCooldownException.class)
        public ResponseEntity<Map<String, Object>> handleOtpCooldown(
                        OtpCooldownException ex) {

                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                                .body(Map.of(
                                                "message", ex.getMessage(),
                                                "secondsRemaining", ex.getSecondsRemaining()));
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<Map<String, String>> handleIllegalArgument(
                        IllegalArgumentException ex) {

                return ResponseEntity.badRequest()
                                .body(Map.of(
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<Map<String, String>> handleValidation(
                        MethodArgumentNotValidException ex) {

                String message = ex.getBindingResult()
                                .getFieldErrors()
                                .get(0)
                                .getDefaultMessage();

                return ResponseEntity.badRequest()
                                .body(Map.of("message", message));
        }
}
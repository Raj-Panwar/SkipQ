package com.skipq.backend.exception;

public class NoActiveOrderException extends RuntimeException {

    public NoActiveOrderException(String message) {
        super(message);
    }
}
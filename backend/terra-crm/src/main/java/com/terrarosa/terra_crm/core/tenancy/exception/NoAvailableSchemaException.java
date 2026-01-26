package com.terrarosa.terra_crm.core.tenancy.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when no ready schemas are available in the schema pool.
 * This indicates that the pool needs to be replenished.
 * 
 * Returns HTTP 503 (Service Unavailable) to indicate temporary unavailability.
 */
@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public class NoAvailableSchemaException extends RuntimeException {
    
    public NoAvailableSchemaException(String message) {
        super(message);
    }
    
    public NoAvailableSchemaException(String message, Throwable cause) {
        super(message, cause);
    }
}

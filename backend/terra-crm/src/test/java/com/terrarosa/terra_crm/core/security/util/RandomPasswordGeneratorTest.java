package com.terrarosa.terra_crm.core.security.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RandomPasswordGeneratorTest {

    @Test
    void generatedPasswordHasRequiredLengthAndCharacterTypes() {
        int length = 16;
        String password = RandomPasswordGenerator.generateSecurePassword(length);

        assertNotNull(password, "Password should not be null");
        assertTrue(password.length() >= length, "Password should have at least the requested length");

        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;

        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) {
                hasUpper = true;
            } else if (Character.isLowerCase(c)) {
                hasLower = true;
            } else if (Character.isDigit(c)) {
                hasDigit = true;
            } else {
                hasSpecial = true;
            }
        }

        assertTrue(hasUpper, "Password should contain at least one uppercase character");
        assertTrue(hasLower, "Password should contain at least one lowercase character");
        assertTrue(hasDigit, "Password should contain at least one digit");
        assertTrue(hasSpecial, "Password should contain at least one special character");
    }

    @Test
    void generatePasswordRejectsTooShortLength() {
        boolean thrown = false;
        try {
            RandomPasswordGenerator.generateSecurePassword(4);
        } catch (IllegalArgumentException ex) {
            thrown = true;
        }
        assertTrue(thrown, "Generator should reject length smaller than 8");
    }
}


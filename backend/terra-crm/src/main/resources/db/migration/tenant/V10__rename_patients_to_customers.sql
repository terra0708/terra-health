-- Rename patients table to customers
ALTER TABLE patients RENAME TO customers;

-- Rename indices for customers
ALTER INDEX idx_patients_lead_id RENAME TO idx_customers_lead_id;

-- Rename patient_id column in appointments
ALTER TABLE appointments RENAME COLUMN patient_id TO customer_id;

-- Rename index for appointments
ALTER INDEX idx_appointments_patient_id RENAME TO idx_appointments_customer_id;

-- Rename the trigger for updated_at (if needed, but usually it's fine)
-- If we want to be thorough:
ALTER TRIGGER update_patients_updated_at ON customers RENAME TO update_customers_updated_at;

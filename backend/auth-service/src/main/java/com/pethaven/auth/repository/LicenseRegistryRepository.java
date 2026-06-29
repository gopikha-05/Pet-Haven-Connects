package com.pethaven.auth.repository;

import com.pethaven.auth.model.LicenseRegistry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LicenseRegistryRepository extends JpaRepository<LicenseRegistry, Long> {
    Optional<LicenseRegistry> findByLicenseNumberAndRole(String licenseNumber, String role);
    Optional<LicenseRegistry> findByLicenseNumber(String licenseNumber);
}

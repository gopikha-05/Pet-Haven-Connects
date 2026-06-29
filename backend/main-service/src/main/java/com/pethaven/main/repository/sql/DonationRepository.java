package com.pethaven.main.repository.sql;

import com.pethaven.main.model.sql.Donation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DonationRepository extends JpaRepository<Donation, String> {
    List<Donation> findByUserId(String userId);
    List<Donation> findByShelter(String shelter);
}

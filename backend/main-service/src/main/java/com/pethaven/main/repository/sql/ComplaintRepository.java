package com.pethaven.main.repository.sql;

import com.pethaven.main.model.sql.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, String> {
    List<Complaint> findByRaisedByUserId(String raisedByUserId);
    List<Complaint> findByAgainstUserId(String againstUserId);
}

package com.pethaven.main.repository.sql;

import com.pethaven.main.model.sql.SupplyOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SupplyOrderRepository extends JpaRepository<SupplyOrder, String> {
    List<SupplyOrder> findByAdopterId(String adopterId);
    List<SupplyOrder> findByShelterId(String shelterId);
}

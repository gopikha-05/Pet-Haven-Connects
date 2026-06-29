package com.pethaven.main.repository.sql;

import com.pethaven.main.model.sql.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}

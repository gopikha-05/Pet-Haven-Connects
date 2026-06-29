package com.pethaven.main.repository.sql;

import com.pethaven.main.model.sql.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
}

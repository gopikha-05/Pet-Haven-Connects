package com.pethaven.main.repository.sql;

import com.pethaven.main.model.sql.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartRepository extends JpaRepository<Cart, String> {
}

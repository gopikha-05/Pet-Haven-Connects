package com.pethaven.main.repository.nosql;

import com.pethaven.main.model.nosql.SupplyProduct;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface SupplyProductRepository extends MongoRepository<SupplyProduct, String> {
    List<SupplyProduct> findByShelterId(String shelterId);
}

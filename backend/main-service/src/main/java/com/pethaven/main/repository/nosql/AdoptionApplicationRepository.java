package com.pethaven.main.repository.nosql;

import com.pethaven.main.model.nosql.AdoptionApplication;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface AdoptionApplicationRepository extends MongoRepository<AdoptionApplication, String> {
    List<AdoptionApplication> findByAdopterId(String adopterId);
    List<AdoptionApplication> findByPetId(String petId);
    List<AdoptionApplication> findByStatus(String status);
}

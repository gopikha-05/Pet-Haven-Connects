package com.pethaven.main.repository.nosql;

import com.pethaven.main.model.nosql.MedicalRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface MedicalRecordRepository extends MongoRepository<MedicalRecord, String> {
    Optional<MedicalRecord> findByPetId(String petId);
}

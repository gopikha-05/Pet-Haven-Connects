package com.pethaven.main.repository.nosql;

import com.pethaven.main.model.nosql.CareLogs;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface CareLogsRepository extends MongoRepository<CareLogs, String> {
    List<CareLogs> findByPetId(String petId);
    List<CareLogs> findByPetIdAndLogType(String petId, String logType);
}

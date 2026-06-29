package com.pethaven.main.repository.nosql;

import com.pethaven.main.model.nosql.Appointment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    List<Appointment> findByVetId(String vetId);
    List<Appointment> findByPetId(String petId);
    List<Appointment> findByStatus(String status);
}

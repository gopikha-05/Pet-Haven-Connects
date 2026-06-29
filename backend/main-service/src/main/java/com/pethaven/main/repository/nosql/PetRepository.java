package com.pethaven.main.repository.nosql;

import com.pethaven.main.model.nosql.Pet;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PetRepository extends MongoRepository<Pet, String> {
    List<Pet> findByStatus(String status);
    List<Pet> findByShelterId(String shelterId);
    List<Pet> findBySpecies(String species);
}

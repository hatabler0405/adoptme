package com.htabler0405.adoptme.repositories;

import com.htabler0405.adoptme.dto.CreateUserRequest;
import com.htabler0405.adoptme.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
    void save(CreateUserRequest user);
}
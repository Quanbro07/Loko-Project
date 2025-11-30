package com.exproject.backend.user;

import com.exproject.backend.user.info.Role;
import com.exproject.backend.user.info.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Date;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findById(Long id);
    Optional<User> findByVerificationCode(String verificationCode);

    Page<User> findAllByRoleNot(Role role, Pageable pageable);

    @Query("SELECT u FROM User u " +
            "WHERE u.role = :role " +
            "AND u.vipEndDate < :expireDate "
    )
    Page<User> findAllRoleUserAndExpireDateBefore(
            @Param("role") Role role,
            @Param("expireDate") LocalDate expireDate,
            Pageable pageable);
}

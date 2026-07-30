package com.enovarobotics.pguard.repository;

import com.enovarobotics.pguard.model.entity.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {

    Optional<VerificationCode> findTopByEmailAndPurposeAndConsumedFalseOrderByCreatedAtDesc(
            String email, VerificationCode.Purpose purpose);

    @Modifying
    @Query("update VerificationCode v set v.consumed = true " +
            "where v.email = :email and v.purpose = :purpose and v.consumed = false")
    void invalidateActiveCodes(@Param("email") String email, @Param("purpose") VerificationCode.Purpose purpose);

    @Modifying
    @Query("delete from VerificationCode v where v.expiresAt < :cutoff")
    void deleteExpiredBefore(@Param("cutoff") LocalDateTime cutoff);
}

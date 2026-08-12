package com.enovarobotics.pguard.service;

import com.enovarobotics.pguard.model.entity.VerificationCode;
import com.enovarobotics.pguard.repository.VerificationCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VerificationCodeServiceTest {

    @Mock
    private VerificationCodeRepository repository;

    @Mock
    private EmailService emailService;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private VerificationCodeService service;

    @BeforeEach
    void setUp() {
        service = new VerificationCodeService(repository, passwordEncoder, emailService);
        ReflectionTestUtils.setField(service, "ttlMinutes", 10L);
        ReflectionTestUtils.setField(service, "resendCooldownSeconds", 60L);
    }

    @Test
    void generateAndSend_savesHashedCode_neverPlainText() {
        when(repository.findTopByEmailAndPurposeAndConsumedFalseOrderByCreatedAtDesc(any(), any()))
                .thenReturn(Optional.empty());
        when(emailService.sendVerificationCode(any(), any(), any())).thenReturn(true);

        String result = service.generateAndSend("user@example.com", "User", VerificationCode.Purpose.SIGNUP_VERIFICATION);

        ArgumentCaptor<VerificationCode> captor = ArgumentCaptor.forClass(VerificationCode.class);
        verify(repository).save(captor.capture());

        VerificationCode saved = captor.getValue();
        assertNotNull(saved.getCodeHash());
        assertTrue(saved.getCodeHash().startsWith("$2")); // format BCrypt
        assertFalse(saved.isConsumed());
        assertEquals(0, saved.getAttempts());

        verify(emailService).sendVerificationCode(
                org.mockito.ArgumentMatchers.eq("user@example.com"),
                org.mockito.ArgumentMatchers.eq("User"),
                any());
        assertNull(result);
        verify(repository).invalidateActiveCodes("user@example.com", VerificationCode.Purpose.SIGNUP_VERIFICATION);
    }

    @Test
    void generateAndSend_respectsResendCooldown() {
        VerificationCode recent = VerificationCode.builder()
                .email("user@example.com")
                .codeHash("hash")
                .purpose(VerificationCode.Purpose.SIGNUP_VERIFICATION)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .createdAt(LocalDateTime.now())
                .build();

        when(repository.findTopByEmailAndPurposeAndConsumedFalseOrderByCreatedAtDesc(any(), any()))
                .thenReturn(Optional.of(recent));

        assertThrows(VerificationCodeService.TooManyRequestsException.class,
                () -> service.generateAndSend("user@example.com", "User", VerificationCode.Purpose.SIGNUP_VERIFICATION));

        verify(emailService, never()).sendVerificationCode(any(), any(), any());
    }

    @Test
    void verify_correctCode_marksConsumed() {
        String rawCode = "123456";
        VerificationCode entity = VerificationCode.builder()
                .email("user@example.com")
                .codeHash(passwordEncoder.encode(rawCode))
                .purpose(VerificationCode.Purpose.SIGNUP_VERIFICATION)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .consumed(false)
                .build();

        when(repository.findTopByEmailAndPurposeAndConsumedFalseOrderByCreatedAtDesc(any(), any()))
                .thenReturn(Optional.of(entity));

        assertDoesNotThrow(() ->
                service.verify("user@example.com", rawCode, VerificationCode.Purpose.SIGNUP_VERIFICATION));

        assertTrue(entity.isConsumed());
        verify(repository).save(entity);
    }

    @Test
    void verify_wrongCode_incrementsAttemptsAndThrows() {
        VerificationCode entity = VerificationCode.builder()
                .email("user@example.com")
                .codeHash(passwordEncoder.encode("123456"))
                .purpose(VerificationCode.Purpose.SIGNUP_VERIFICATION)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .consumed(false)
                .build();

        when(repository.findTopByEmailAndPurposeAndConsumedFalseOrderByCreatedAtDesc(any(), any()))
                .thenReturn(Optional.of(entity));

        assertThrows(VerificationCodeService.InvalidCodeException.class,
                () -> service.verify("user@example.com", "000000", VerificationCode.Purpose.SIGNUP_VERIFICATION));

        assertEquals(1, entity.getAttempts());
        assertFalse(entity.isConsumed());
    }

    @Test
    void verify_expiredCode_throwsAndConsumes() {
        VerificationCode entity = VerificationCode.builder()
                .email("user@example.com")
                .codeHash(passwordEncoder.encode("123456"))
                .purpose(VerificationCode.Purpose.SIGNUP_VERIFICATION)
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .attempts(0)
                .consumed(false)
                .build();

        when(repository.findTopByEmailAndPurposeAndConsumedFalseOrderByCreatedAtDesc(any(), any()))
                .thenReturn(Optional.of(entity));

        assertThrows(VerificationCodeService.InvalidCodeException.class,
                () -> service.verify("user@example.com", "123456", VerificationCode.Purpose.SIGNUP_VERIFICATION));

        assertTrue(entity.isConsumed());
    }

    @Test
    void verify_afterMaxAttempts_isInvalidatedEvenWithCorrectCode() {
        VerificationCode entity = VerificationCode.builder()
                .email("user@example.com")
                .codeHash(passwordEncoder.encode("123456"))
                .purpose(VerificationCode.Purpose.SIGNUP_VERIFICATION)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attempts(5) // MAX_ATTEMPTS already reached
                .consumed(false)
                .build();

        when(repository.findTopByEmailAndPurposeAndConsumedFalseOrderByCreatedAtDesc(any(), any()))
                .thenReturn(Optional.of(entity));

        assertThrows(VerificationCodeService.InvalidCodeException.class,
                () -> service.verify("user@example.com", "123456", VerificationCode.Purpose.SIGNUP_VERIFICATION));

        assertTrue(entity.isConsumed());
    }

}

package com.enovarobotics.pguard.controller;

import com.enovarobotics.pguard.model.dto.LoginRequest;
import com.enovarobotics.pguard.model.dto.RegisterRequest;
import com.enovarobotics.pguard.model.entity.User;
import com.enovarobotics.pguard.repository.UserRepository;
import com.enovarobotics.pguard.security.JwtService;
import com.enovarobotics.pguard.service.GoogleTokenService;
import com.enovarobotics.pguard.service.VerificationCodeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private VerificationCodeService verificationCodeService;
    @Mock
    private GoogleTokenService googleTokenService;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private AuthController controller;

    @BeforeEach
    void setUp() {
        controller = new AuthController(userRepository, passwordEncoder, jwtService, verificationCodeService, googleTokenService);
        ReflectionTestUtils.setField(controller, "defaultRegistrationRole", "OPERATEUR");
    }

    private User localUser(String email, String rawPassword, boolean verified) {
        return User.builder()
                .id(1L)
                .email(email)
                .fullName("Test User")
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(User.Role.OPERATEUR)
                .authProvider(User.AuthProvider.LOCAL)
                .emailVerified(verified)
                .failedLoginAttempts(0)
                .build();
    }

    @Test
    void login_unverifiedAccount_isRejectedWithForbidden() {
        User user = localUser("user@example.com", "Password1!", false);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.login(new LoginRequest("user@example.com", "Password1!"));

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    void login_locksAccountAfterFiveFailedAttempts() {
        User user = localUser("user@example.com", "Password1!", true);
        user.setFailedLoginAttempts(4);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.login(new LoginRequest("user@example.com", "WrongPassword!"));

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals(5, user.getFailedLoginAttempts());
        assertTrue(user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now()));
    }

    @Test
    void login_rejectsWhenAccountCurrentlyLocked() {
        User user = localUser("user@example.com", "Password1!", true);
        user.setLockedUntil(LocalDateTime.now().plusMinutes(10));
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.login(new LoginRequest("user@example.com", "Password1!"));

        assertEquals(HttpStatus.LOCKED, response.getStatusCode());
    }

    @Test
    void login_googleAccount_cannotUsePasswordLogin() {
        User user = localUser("user@example.com", "irrelevant", true);
        user.setAuthProvider(User.AuthProvider.GOOGLE);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.login(new LoginRequest("user@example.com", "anything"));

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void register_existingEmail_returnsConflictWithoutLeakingDetails() {
        User existing = localUser("user@example.com", "Password1!", true);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(existing));

        ResponseEntity<?> response = controller.register(
                new RegisterRequest("user@example.com", "Someone Else", "NewPassword1!"));

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        verify(verificationCodeService, never()).generateAndSend(any(), any(), any());
    }

    @Test
    void register_newEmail_createsVerifiedUserAndLogsInImmediately() {
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.register(
                new RegisterRequest("new@example.com", "New User", "Password1!"));

        assertEquals(HttpStatus.CREATED, response.getStatusCode());

        org.mockito.ArgumentCaptor<User> captor = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        // Email verification has been removed: new accounts are active immediately.
        assertEquals(true, captor.getValue().isEmailVerified());
        assertEquals("new@example.com", captor.getValue().getEmail());

        // No verification code should be generated anymore.
        verify(verificationCodeService, never()).generateAndSend(any(), any(), any());

        // The response body should already be a usable login token (VerificationResponse dance is gone).
        assertTrue(response.getBody() instanceof com.enovarobotics.pguard.model.dto.LoginResponse);
    }
}

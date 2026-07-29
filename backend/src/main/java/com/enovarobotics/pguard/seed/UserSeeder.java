package com.enovarobotics.pguard.seed;

import com.enovarobotics.pguard.model.entity.User;
import com.enovarobotics.pguard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Crée les comptes par défaut (administrateur + opérateur) au premier
 * démarrage, pour permettre de se connecter immédiatement en
 * développement sans devoir créer un compte manuellement.
 *
 * IMPORTANT — sécurité : ces identifiants sont uniquement pour le
 * développement local. Avant toute mise en production, supprimer ce
 * seeder ou changer les mots de passe par défaut.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(1) // s'exécute avant DataSeeder, sans dépendance fonctionnelle entre les deux
public class UserSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        if (userRepository.count() > 0) {
            log.info("Utilisateurs déjà présents en base, génération ignorée");
            return;
        }

        userRepository.save(User.builder()
                .email("admin@pguard.local")
                .fullName("Administrateur PGuard")
                .passwordHash(passwordEncoder.encode("Admin123!"))
                .role(User.Role.ADMINISTRATEUR)
                .build());

        userRepository.save(User.builder()
                .email("operateur@pguard.local")
                .fullName("Opérateur PGuard")
                .passwordHash(passwordEncoder.encode("Operateur123!"))
                .role(User.Role.OPERATEUR)
                .build());

        log.info("Comptes par défaut créés :");
        log.info("  admin@pguard.local / Admin123! (ADMINISTRATEUR)");
        log.info("  operateur@pguard.local / Operateur123! (OPERATEUR)");
    }
}

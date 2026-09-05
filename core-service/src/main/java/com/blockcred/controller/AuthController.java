package com.blockcred.controller;

import com.blockcred.model.User;
import com.blockcred.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository repository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required"));
        }

        return repository.findByEmail(email.trim().toLowerCase())
                .filter(u -> u.getPassword().equals(password))
                .map(u -> ResponseEntity.ok(Map.of(
                        "token", "fake-jwt-token-for-demo",
                        "user", u
                )))
                .orElse(ResponseEntity.status(401).body(Map.of("message", "Invalid email or password")));
    }

    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "blockcred-core"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email address is required"));
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
        }
        
        String cleanEmail = user.getEmail().trim().toLowerCase();
        user.setEmail(cleanEmail);

        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole("STUDENT");
        } else {
            user.setRole(user.getRole().toUpperCase());
        }

        var existing = repository.findByEmail(cleanEmail);
        if (existing.isPresent()) {
            User u = existing.get();
            u.setPassword(user.getPassword());
            if (user.getFullName() != null && !user.getFullName().isBlank()) {
                u.setFullName(user.getFullName());
            }
            if (user.getRole() != null && !user.getRole().isBlank()) {
                u.setRole(user.getRole().toUpperCase());
            }
            User saved = repository.save(u);
            return ResponseEntity.ok(Map.of(
                    "token", "fake-jwt-token-for-demo",
                    "user", saved,
                    "message", "Account updated and signed in successfully"
            ));
        }

        User saved = repository.save(user);
        return ResponseEntity.ok(Map.of(
                "token", "fake-jwt-token-for-demo",
                "user", saved,
                "message", "Account created successfully"
        ));
    }
}


package com.blockcred.controller;

import com.blockcred.model.Certificate;
import com.blockcred.service.CertificateService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/certificates")
@CrossOrigin(origins = "*")
public class CertificateController {

    private final CertificateService certificateService;

    @Autowired
    public CertificateController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    /**
     * Issue a certificate (Multipart: studentName, courseName, institutionName, certFile)
     */
    @PostMapping("/issue")
    public ResponseEntity<?> issueCertificate(
            @RequestParam("studentName") String studentName,
            @RequestParam("courseName") String courseName,
            @RequestParam("institutionName") String institutionName,
            @RequestParam("certFile") MultipartFile certFile,
            HttpServletRequest request) {
        try {
            if (certFile.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Certificate file is required"));
            }

            String origin = request.getHeader("Origin");
            if (origin == null || origin.isBlank()) {
                origin = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
            }

            Map<String, Object> result = certificateService.issueCertificate(
                    studentName, courseName, institutionName, certFile, origin);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Certificate issuance failed: " + e.getMessage()));
        }
    }

    /**
     * Create / Store certificate metadata (JSON body)
     */
    @PostMapping
    public ResponseEntity<?> createCertificate(@RequestBody Certificate cert) {
        try {
            if (cert.getId() == null || cert.getId().isBlank()) {
                cert.setId("CERT-" + System.currentTimeMillis());
            }
            Certificate saved = certificateService.saveCertificate(cert);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to save certificate: " + e.getMessage()));
        }
    }

    /**
     * List all certificates
     */
    @GetMapping
    public ResponseEntity<List<Certificate>> getAll() {
        return ResponseEntity.ok(certificateService.getAllCertificates());
    }

    /**
     * Get certificate by Hash
     */
    @GetMapping("/hash/{hash}")
    public ResponseEntity<Certificate> getByHash(@PathVariable String hash) {
        return certificateService.getCertificateByHash(hash)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Verify certificate by Hash
     */
    @GetMapping("/verify-hash/{hash}")
    public ResponseEntity<?> verifyByHash(@PathVariable String hash) {
        return certificateService.getCertificateByHash(hash)
                .map(cert -> ResponseEntity.ok(Map.of(
                        "verified", true,
                        "certificate", cert
                )))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "verified", false,
                        "message", "Certificate hash not found in cryptographic registry"
                )));
    }

    /**
     * Get certificate by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Certificate> getById(@PathVariable String id) {
        return certificateService.getCertificateById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Verify certificate by ID
     */
    @GetMapping("/verify/{id}")
    public ResponseEntity<?> verifyById(@PathVariable String id) {
        return certificateService.getCertificateById(id)
                .map(cert -> ResponseEntity.ok(Map.of(
                        "verified", true,
                        "certificate", cert
                )))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "verified", false,
                        "message", "Invalid or non-existent Certificate ID"
                )));
    }

    /**
     * Verify PDF integrity by uploading the file
     */
    @PostMapping("/verify-pdf")
    public ResponseEntity<?> verifyPdf(@RequestParam("certFile") MultipartFile certFile) {
        try {
            if (certFile.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "File is required for verification"));
            }

            return certificateService.verifyCertificateFile(certFile)
                    .map(cert -> ResponseEntity.ok(Map.of(
                            "verified", true,
                            "certificate", cert
                    )))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                            "verified", false,
                            "message", "Certificate hash not found in cryptographic registry. File may have been altered or tampered with."
                    )));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Verification failed: " + e.getMessage()));
        }
    }
}

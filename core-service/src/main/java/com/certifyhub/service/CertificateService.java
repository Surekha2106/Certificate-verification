package com.certifyhub.service;

import com.certifyhub.model.Certificate;
import com.certifyhub.repository.CertificateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CertificateService {

    private final CertificateRepository repository;
    private final CryptoService cryptoService;
    private final QrCodeService qrCodeService;

    private final String uploadDir = "uploads";

    @Autowired
    public CertificateService(CertificateRepository repository, CryptoService cryptoService, QrCodeService qrCodeService) {
        this.repository = repository;
        this.cryptoService = cryptoService;
        this.qrCodeService = qrCodeService;

        // Ensure upload directory exists
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    /**
     * Issue a new certificate:
     * 1. Store the uploaded file.
     * 2. Compute SHA-256 hash.
     * 3. Generate cryptographic ID and transaction hash.
     * 4. Generate QR code for instant verification.
     * 5. Save to database.
     */
    public Map<String, Object> issueCertificate(String studentName, String courseName, String institutionName, 
                                                MultipartFile file, String origin) throws IOException {
        String certId = "CERT-" + System.currentTimeMillis();

        // 1. Save file locally
        String fileName = System.currentTimeMillis() + "-" + (file.getOriginalFilename() != null ? file.getOriginalFilename() : "cert.pdf");
        Path targetPath = Paths.get(uploadDir, fileName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // 2. Calculate SHA-256 Hash
        String fileHash = cryptoService.calculateHash(file);

        // 3. Generate Digital Transaction/Integrity Signature
        String txHash = cryptoService.generateDigitalSignature(certId, fileHash);

        // 4. Save metadata in DB
        Certificate certificate = new Certificate(certId, studentName, courseName, institutionName, fileHash, targetPath.toString(), txHash);
        Certificate savedCert = repository.save(certificate);

        // 5. Generate QR Code linking to verification URL
        String baseUrl = (origin != null && !origin.isBlank()) ? origin : "http://localhost:8080";
        String verificationUrl = baseUrl + "/#verify-certificate?id=" + certId;
        String qrCodeDataUrl = qrCodeService.generateQrCodeDataUrl(verificationUrl, 250, 250);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Certificate issued successfully");
        response.put("certId", certId);
        response.put("txHash", txHash);
        response.put("qrCode", qrCodeDataUrl);
        response.put("metadata", savedCert);

        return response;
    }

    public Certificate saveCertificate(Certificate certificate) {
        if (certificate.getTxHash() == null || certificate.getTxHash().isBlank()) {
            certificate.setTxHash(cryptoService.generateDigitalSignature(
                    certificate.getId(),
                    certificate.getHash() != null ? certificate.getHash() : ""
            ));
        }
        return repository.save(certificate);
    }

    public List<Certificate> getAllCertificates() {
        return repository.findAll();
    }

    public Optional<Certificate> getCertificateById(String id) {
        return repository.findById(id);
    }

    public Optional<Certificate> getCertificateByHash(String hash) {
        return repository.findByHash(hash);
    }

    /**
     * Verify an uploaded PDF file against stored SHA-256 hashes.
     */
    public Optional<Certificate> verifyCertificateFile(MultipartFile file) throws IOException {
        String fileHash = cryptoService.calculateHash(file);
        return repository.findByHash(fileHash);
    }
}

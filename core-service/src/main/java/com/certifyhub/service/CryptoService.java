package com.certifyhub.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
public class CryptoService {

    /**
     * Compute SHA-256 Hash of an uploaded file.
     */
    public String calculateHash(MultipartFile file) throws IOException {
        return calculateHash(file.getBytes());
    }

    /**
     * Compute SHA-256 Hash of a byte array.
     */
    public String calculateHash(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(data);
            return bytesToHex(encodedhash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    /**
     * Generate a cryptographic digital token / transaction hash for the issued certificate.
     */
    public String generateDigitalSignature(String certId, String fileHash) {
        String combined = certId + ":" + fileHash + ":" + System.currentTimeMillis();
        return "0x" + calculateHash(combined.getBytes(StandardCharsets.UTF_8));
    }

    private String bytesToHex(byte[] hash) {
        StringBuilder hexString = new StringBuilder(2 * hash.length);
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const JAVA_BACKEND_URL = process.env.JAVA_BACKEND_URL || 'http://localhost:8080/api';

// CORS setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Create uploads folder if not exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

/**
 * 0. HEALTH CHECK
 */
app.get('/api/health', async (req, res) => {
    try {
        await axios.get(`${JAVA_BACKEND_URL}/auth/ping`, { timeout: 3000 });
        res.json({ gateway: 'UP', coreService: 'UP' });
    } catch (e) {
        if (e.code === 'ECONNREFUSED') {
            return res.status(503).json({ gateway: 'UP', coreService: 'DOWN', error: 'Java core service is not running on port 8080.' });
        }
        res.json({ gateway: 'UP', coreService: 'UP' });
    }
});

/**
 * 1. AUTH PROXY (Node.js -> Java)
 */
app.post('/api/auth/login', async (req, res) => {
    try {
        const response = await axios.post(`${JAVA_BACKEND_URL}/auth/login`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (!error.response) {
            return res.status(503).json({ message: 'Java Core Service is not running. Please start it on port 8080.' });
        }
        res.status(error.response.status).json(error.response.data || { message: 'Login failed' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const response = await axios.post(`${JAVA_BACKEND_URL}/auth/register`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (!error.response) {
            return res.status(503).json({ message: 'Java Core Service is not running. Please start it on port 8080.' });
        }
        res.status(error.response.status).json(error.response.data || { message: 'Registration failed' });
    }
});

/**
 * 2. ISSUE CERTIFICATE (Hybrid Flow)
 * Step 1: Upload (Node.js)
 * Step 2: SHA-256 Hashing (Raw file buffer)
 * Step 3: Call Java for metadata storage
 * Step 4: Digital Transaction Hash
 * Step 5: QR Code generation
 */
app.post('/api/certificates/issue', upload.single('certFile'), async (req, res) => {
    try {
        const { studentName, courseName, institutionName } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'Certificate file is required' });
        }

        // --- Step 2: Standard SHA256 Hash of raw byte buffer ---
        const fileBuffer = fs.readFileSync(file.path);
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const certId = `CERT-${Date.now()}`;
        const txHash = '0x' + crypto.createHash('sha256').update(`${certId}:${fileHash}:${Date.now()}`).digest('hex');

        // --- Step 3: Store in Java Service ---
        const javaResponse = await axios.post(`${JAVA_BACKEND_URL}/certificates`, {
            id: certId,
            studentName,
            courseName,
            institutionName,
            hash: fileHash,
            filePath: file.path,
            txHash: txHash
        });

        // --- Step 5: QR Code Generation ---
        const origin = req.headers.origin || `http://localhost:${PORT}`;
        const verificationUrl = `${origin}/#verify-certificate?id=${certId}`;
        const qrCodeDataUrl = await qrcode.toDataURL(verificationUrl);

        res.json({
            message: 'Certificate issued successfully',
            certId,
            txHash,
            qrCode: qrCodeDataUrl,
            metadata: javaResponse.data
        });

    } catch (error) {
        console.error('Certificate issuance error:', error.message);
        res.status(error.response?.status || 500).json({
            message: 'Certificate issuance failed',
            error: error.response?.data?.message || error.message
        });
    }
});

/**
 * 2.5 LIST ALL CERTIFICATES
 */
app.get('/api/certificates', async (req, res) => {
    try {
        const response = await axios.get(`${JAVA_BACKEND_URL}/certificates`);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Certificate service down' });
    }
});

/**
 * 3. VERIFY CERTIFICATE BY ID
 */
app.get('/api/certificates/verify/:id', async (req, res) => {
    try {
        const certId = req.params.id;
        const springResponse = await axios.get(`${JAVA_BACKEND_URL}/certificates/verify/${encodeURIComponent(certId)}`);
        res.status(springResponse.status).json(springResponse.data);
    } catch (error) {
        res.status(error.response?.status || 404).json(error.response?.data || { verified: false, message: 'Invalid or expired certificate ID' });
    }
});

/**
 * 4. VERIFY FILE INTEGRITY
 */
app.post('/api/certificates/verify-pdf', upload.single('certFile'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ message: 'File is required for verification' });

        const fileBuffer = fs.readFileSync(file.path);
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Search Java service for this hash
        try {
            const springResponse = await axios.get(`${JAVA_BACKEND_URL}/certificates/verify-hash/${fileHash}`);
            res.json(springResponse.data);
        } catch (err) {
            res.status(404).json({ verified: false, message: 'Certificate hash not found in cryptographic registry. File may have been altered or tampered with.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Verification failed: ' + error.message });
    } finally {
        // Cleanup uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
    }
});


// Serve frontend routing (for client-side routing if any)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`CertifyHub Gateway running at http://localhost:${PORT}`);
});

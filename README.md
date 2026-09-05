<div align="center">
  
  # 🎓 CertifyHub  
  **Digital Credential & Certificate Verification Platform**

  <p align="center">
    <img src="https://img.shields.io/badge/Backend-Java_Spring_Boot-6db33f?style=for-the-badge&logo=spring&logoColor=white" alt="Spring Boot" />
    <img src="https://img.shields.io/badge/Database-MySQL_%2F_H2-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
    <img src="https://img.shields.io/badge/Security-SHA--256_Digest-e34f26?style=for-the-badge&logo=auth0&logoColor=white" alt="SHA-256" />
    <img src="https://img.shields.io/badge/Frontend-HTML5_CSS3_JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=black" alt="Frontend" />
  </p>

  *A pure Full-Stack Java platform for tamper-proof certificate issuance, cryptographic hashing, QR verification, and instant authenticity checks.*
</div>

---

## 📖 Overview

**CertifyHub** is an enterprise-grade **Full-Stack Java (Spring Boot)** web application designed to eradicate credential fraud and certificate forgery. By generating cryptographic `SHA-256` digital fingerprints for issued documents and storing them securely in a high-performance database registry, it enables instant, tamper-evident verification via ID lookup, file re-hashing, or QR code scanning.

---

## ✨ Key Features

- 🔐 **Multi-Role Authentication**: Role-based access control for Admins, Institutions, and Students.
- 📊 **Interactive Analytics Dashboard**: Live statistics, recent activity feeds, and credential registries.
- 🚀 **Native Java Cryptographic Issuance**: Upload PDF certificates. Spring Boot computes an immutable `SHA-256` hash and generates a unique digital signature.
- 📱 **Embedded ZXing QR Code Generation**: Instant QR verification codes generated in-memory in pure Java.
- 🛡️ **Zero-Tolerance PDF Integrity Check**: Upload any file to re-calculate its checksum and compare against stored records—altering even a single pixel fails validation!
- 💾 **Multi-Database Support**: Ready out-of-the-box with **H2 Database** (zero configuration) or persistent **MySQL / PostgreSQL**.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend Framework** | **Java 17+ / Spring Boot 3.4** | REST APIs, business logic, file storage, and static resource serving. |
| **Cryptography** | **`java.security.MessageDigest`** | Native SHA-256 document hashing and digital signatures. |
| **QR Code Engine** | **Google ZXing** (`core` + `javase`) | High-speed Base64 QR code generator. |
| **Database** | **MySQL** / **H2 Database** | JPA & Hibernate with in-memory H2 demo mode and production MySQL mode. |
| **Frontend** | **HTML5, Vanilla CSS3, JavaScript** | Modern glassmorphism UI served directly via Spring Boot. |

---

## 🚀 Setup & Execution

### 1. Prerequisites
- **Java JDK** (17 or higher)
- **Maven** *(or use the provided `./mvnw` wrapper)*

### 2. Running the Application

#### Option A: Quick Start (Windows)
Double-click `RESTART_SERVICES.bat` in the root folder.

#### Option B: Terminal Command
```bash
cd core-service
./mvnw spring-boot:run
```
*(Runs on port `8080`)*

### 3. Access the Application
🌐 Open your browser and navigate to: **[http://localhost:8080](http://localhost:8080)**

**Default Demo Credentials:**
- **Email:** `john.doe@example.com`
- **Password:** `password`
- **Role:** `Admin`

**H2 Database Web Console:**
- URL: **[http://localhost:8080/h2-console](http://localhost:8080/h2-console)**
- JDBC URL: `jdbc:h2:mem:certifyhubdb`
- Username: `sa`
- Password: `password`

---

## 🗄️ Database Configuration

You can toggle between databases in [`core-service/src/main/resources/application.properties`](file:///d:/Final_Of_Surekha/Projects/new-certification/core-service/src/main/resources/application.properties):

* **H2 (Default, In-Memory)**: Works out of the box with zero external database software required.
* **MySQL (Persistent)**: Uncomment the MySQL lines in `application.properties`:
  ```properties
  spring.datasource.url=jdbc:mysql://localhost:3306/certifyhubdb?createDatabaseIfNotExist=true&useSSL=false
  spring.datasource.username=root
  spring.datasource.password=root
  spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
  spring.jpa.hibernate.ddl-auto=update
  spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
  ```

---

<div align="center">
  <i>Built with ❤️ using Full-Stack Java & Spring Boot</i>
</div>

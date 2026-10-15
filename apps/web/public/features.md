# EduRaport — Core Features & Technical Architecture

EduRaport is an all-in-one Education ERP and Smart E-Raport platform tailored for Indonesian private schools, Islamic boarding schools (pesantren), and multi-unit foundations (TK to SMA).

## Key Features & Differentiators

### 1. Kepatuhan Regulasi Kurikulum Merdeka & PPA 2025 (AI Hard Guardrail)
- **Observational Assessment for Early Childhood**: In compliance with Panduan Pembelajaran dan Asesmen (PPA) 2024/2025, EduRaport automatically blocks written cognitive tests for PAUD/TK and SD Fase A, redirecting educators to structured observational assessment rubric (BB, MB, BSH, BSB).
- **Automated AI Assistant for Teachers**: Generates complete RPP/Modul Ajar, formative questions, rubrics, and educational slide outlines in under 2 minutes, with strict contextual CP/TP alignment.
- **Multi-Curriculum Support**: Simultaneously supports Kurikulum Merdeka 2024/2025, K-13 Revisi, Cambridge/IB, and Pesantren internal curriculum (Jayyid, Mumtaz, Maqbul).

### 2. Satu Identitas Lintas Jenjang (Zero Data Silo for Foundations)
- **Unified Student ID**: Students progressing from TK to SD, SMP, and SMA within the same Yayasan retain a persistent single record. Eliminates redundant manual re-entry and reduces Foundation operational expenditure (OpEx).
- **Consolidated Macro Dashboard**: Foundation executives and Kyai can monitor macro metrics across multiple school branches from a unified view.

### 3. Ekosistem Khusus Pesantren & Tahfidz Analytics
- **Tahfidz Tracking (Juz 1–30)**: Real-time dashboard of student Quranic memorization progress with Mutqin/Mumtaz segmentation.
- **Mutaaba'ah Yaumiyah**: Daily tracking of 8 routine acts of worship (sholat fardhu berjamaah, dhuha, tahajjud, rawatib, tilawah) replacing vulnerable paper tracking logs.
- **Dual Report Card Generation**: Single-click printing of Diknas formal report cards alongside internal Diniyah/Tahfidz report cards.

### 4. Portal Terpadu Orang Tua & SHA-256 Digital Signature (Dasbor Wali Murid)
- **Multi-Child Single Account**: Parents with multiple children across different school branches (TK to SMA) manage attendance, academic progress, and fee payments from a single unified portal without separate logins.
- **SHA-256 Tamper-Proof Digital Signature**: Official verification of report cards with SHA-256 cryptographic hashes and QR codes, eliminating thousands of printed paper copies and physical signature logistics.
- **Independent Leave Submissions**: Parents can upload doctor notes and submit sick/leave requests directly from the portal with automated homeroom review.
- **Student Wallet & Canteen Spending Limits**: Enables parents to configure daily/weekly spending caps for their child's school wallet and review real-time canteen transaction histories.
- **Booking Jadwal Konseling Guru BK**: Parents can schedule one-on-one consultation sessions (offline or online) with guidance counselors (Guru BK).
- **Automated Performance & Attendance Threshold Alerts**: Configurable notifications triggering immediate alerts if a student's grade falls below minimum criteria (KKTP) or unexplained absences accumulate.
- **Row-Level Security (RLS) Isolation**: Bank-grade multi-tenant data isolation ensuring parent users can strictly access data associated with verified child relationships (`parent_student_links`).


### 5. Absensi QR & Mood Check-In (Churn Prevention Engine)
- **Emotional Pulse Tracking**: Daily QR check-in records students' emotional state.
- **Intervention Alarm**: A 3-consecutive-day negative mood trend triggers an automatic notification to homeroom teachers and counseling (BK) staff to resolve distress before student churn occurs.

### 6. Keuangan Sekolah, Auto-Posting & SPP Lock
- **Automated Billing via WhatsApp**: Issues customized monthly tuition notices with direct bank payment channels.
- **Smart Report Card Lock (SPP Lock)**: Report card download/viewing access is automatically locked for accounts with overdue unpaid tuition past tolerance limits.
- **BOS & Financial Bookkeeping**: General ledger auto-posting, aging receivables (0-30, 31-60, 61-90+ days), and BOS component budget tracking.

### 7. Executive Helicopter View (Daily 06:00 AM WhatsApp Digest)
- Automatically delivers daily operational summaries to Principals and Foundation Chairs every morning at 06:00 AM via WhatsApp, highlighting teacher absenteeism, empty classroom alerts, and pending receivables.

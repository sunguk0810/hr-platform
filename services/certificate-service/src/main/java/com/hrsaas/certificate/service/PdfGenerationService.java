package com.hrsaas.certificate.service;

import com.hrsaas.certificate.domain.entity.CertificateIssue;

public interface PdfGenerationService {
    /**
     * Generates a PDF for the given certificate issue.
     *
     * @param issue the certificate issue
     * @return the generated PDF as a byte array
     */
    byte[] generatePdf(CertificateIssue issue);
}

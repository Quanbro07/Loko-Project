package com.exproject.backend.pdf;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Component
public class PdfGenerator {

    private static final String FONT_REGULAR = "fonts/Roboto-Regular.ttf";
    private static final String FONT_BOLD = "fonts/Roboto-Bold.ttf";

    public byte[] generatePdfFromHtml(String html) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(outputStream);

            builder.useFont(() -> {
                try {
                    return new ClassPathResource(FONT_REGULAR).getInputStream();
                } catch (IOException e) {
                    System.out.println("Cannot load REGULAR FONT: " + FONT_REGULAR);
                    throw new RuntimeException(e);
                }
            }, "Roboto");

            // Load font Bold
            builder.useFont(() -> {
                try {
                    return new ClassPathResource(FONT_BOLD).getInputStream();
                } catch (IOException e) {
                    System.out.println("Cannot load BOLD FONT: " + FONT_BOLD);
                    throw new RuntimeException(e);
                }
            }, "Roboto-Bold");

            builder.run();
            return outputStream.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to generate PDF: " + e.getMessage(), e);
        }
    }
}
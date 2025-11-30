package com.exproject.backend.pdf;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.File;

@Component
public class PdfGenerator {

    private static final String FONT_REGULAR = "src/main/resources/fonts/Roboto-Regular.ttf";
    private static final String FONT_BOLD = "src/main/resources/fonts/Roboto-Bold.ttf";

    public byte[] generatePdfFromHtml(String html) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();

            builder.withHtmlContent(html, null);
            builder.toStream(outputStream);

            builder.useFont(new File(FONT_REGULAR), "Roboto");
            builder.useFont(new File(FONT_BOLD), "Roboto-Bold");

            builder.run();

            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }
}

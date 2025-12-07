package com.exproject.backend.pdf;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

@Component
public class PdfGenerator {

    // Lưu ý: Đường dẫn bắt đầu bằng dấu / (tính từ thư mục resources)
    private static final String FONT_REGULAR = "/fonts/Roboto-Regular.ttf";
    private static final String FONT_BOLD = "/fonts/Roboto-Bold.ttf";

    public byte[] generatePdfFromHtml(String html) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();

            // Hàm này giúp xử lý các đường dẫn ảnh/css tương đối nếu có
            builder.withHtmlContent(html, null);
            builder.toStream(outputStream);

            // --- SỬA ĐỔI QUAN TRỌNG TẠI ĐÂY ---
            // Thay vì dùng new File(), ta dùng Supplier<InputStream>
            // Cách này hoạt động được cả trong môi trường Docker/JAR
            builder.useFont(() -> getClass().getResourceAsStream(FONT_REGULAR), "Roboto");
            builder.useFont(() -> getClass().getResourceAsStream(FONT_BOLD), "Roboto-Bold");

            builder.run();

            return outputStream.toByteArray();
        } catch (Exception e) {
            // Log lỗi chi tiết để dễ debug
            e.printStackTrace();
            throw new RuntimeException("Failed to generate PDF: " + e.getMessage(), e);
        }
    }
}
package com.exproject.backend.pdf;

import com.exproject.backend.location.dto.LocationDTO;
import com.exproject.backend.trip.dto.TripRequest;
import com.exproject.backend.trip_detail.dto.TripDetailRequest;
import com.exproject.backend.trip_section.dto.TripSectionRequest;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.time.LocalDate;

@Component
public class TripPdfTemplateBuilder {

    // Màu sắc chủ đạo mới
    private static final String BRAND_BLUE = "#4d6ef0";
    private static final String DARK_TEXT = "#1e1e1e";
    private static final String GRAY_TEXT = "#666";
    private static final String LIGHT_BG = "#f8faff";
    private static final String LIGHT_BORDER = "#d7e0f2";

    private String escape(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    private String formatTime(LocalTime time) {
        return time != null ? time.toString() : "";
    }

    private String formatTimeRange(LocalTime start, LocalTime end) {
        if (start == null && end == null) return "";
        if (start != null && end == null) return start.toString();
        if (start == null) return end.toString();
        return start + " — " + end;
    }

    private String formatNumber(Object num) {
        return num != null ? num.toString() : "-";
    }


    // =============================================
    //                BUILD HTML
    // =============================================

    public String buildHtml(TripRequest trip) {

        String tripName = trip.getTripName() != null ? trip.getTripName() : "Your Trip";

        StringBuilder html = new StringBuilder();

        html.append("<!DOCTYPE html>");
        html.append("<html lang='en'>");
        html.append("<head>");
        html.append("<meta charset='UTF-8'/>");

        // =============================================
        //                   CSS
        // =============================================

        html.append("<style>");

        html.append("@page { size: A4; margin: 20mm 15mm 20mm 15mm; }");

        html.append("body { font-family: 'Roboto'; font-size: 13px; line-height: 1.5; color: ").append(DARK_TEXT).append("; }");

        /* ===== COVER PAGE STYLE – CENTRALIZED & PROFESSIONAL ===== */

        html.append(".cover-page {"
                + "width: 100%;"
                + "text-align: center;"
                + "padding-top: 100px;"
                + "} ");

        html.append(".cover-title {"
                + "font-size: 44px;"
                + "font-family: 'Roboto-Bold';"
                + "color: #222;"
                + "margin-bottom: 8px;"
                + "letter-spacing: 1.5px;"
                + "} ");

        html.append(".cover-subtitle {"
                + "font-size: 17px;"
                + "color: #555;"
                + "margin-bottom: 25px;"
                + "letter-spacing: 1px;"
                + "} ");

        html.append(".cover-divider {"
                + "width: 100px;"
                + "height: 4px;"
                + "background: ").append(BRAND_BLUE).append(";"
                + "border-radius: 5px;"
                + "margin: 0 auto 50px auto;"
                + "} ");

        html.append(".info-card {"
                + "width: 60%;"
                + "margin: 0 auto;"
                + "background: ").append(LIGHT_BG).append(";"
                + "border-radius: 12px;"
                + "border: 1px solid #c8d4e9;"
                + "box-shadow: 0 4px 15px rgba(0,0,0,0.06);"
                + "padding: 0;"
                + "} ");

        html.append(".info-row {"
                + "display: flex;"
                + "justify-content: space-between;"
                + "padding: 14px 25px;"
                + "border-bottom: 1px solid ").append(LIGHT_BORDER).append(";"
                + "} ");

        html.append(".info-row.duration {"
                + "display: block;"
                + "background: ").append(BRAND_BLUE).append(";"
                + "border-top-left-radius: 12px;"
                + "border-top-right-radius: 12px;"
                + "padding: 18px 25px;"
                + "text-align: center;"
                + "} ");

        html.append(".duration-title {"
                + "font-size: 16px;"
                + "color: #ffffff;"
                + "font-family: 'Roboto-Bold';"
                + "margin-bottom: 10px;"
                + "} ");

        html.append(".duration-dates-inline {"
                + "display: flex;"
                + "justify-content: space-around;"
                + "width: 100%;"
                + "font-size: 15px;"
                + "} ");

        html.append(".date-item {"
                + "color: #ffffff;"
                + "text-align: center;"
                + "} ");

        html.append(".date-item .label { color: #ffffff; font-size: 13px; margin-right: 5px; }");
        html.append(".date-item .value { color: #ffffff; font-family: 'Roboto-Bold'; font-size: 15px; }");
        html.append(".date-item-flex { display: flex; align-items: center; justify-content: center; }");

        html.append(".info-row:last-child { border-bottom: none; }");

        html.append(".info-label { font-size: 14px; color: ").append(GRAY_TEXT).append("; }");
        html.append(".info-value { font-size: 15px; font-family: 'Roboto-Bold'; color: ").append(DARK_TEXT).append("; }");

        html.append(".cover-footer {"
                + "margin-top: 40px;"
                + "font-size: 12px;"
                + "color: #a0a0a0;"
                + "} ");


        html.append(".day-section { page-break-before: always; }");

        html.append(".day-title {"
                + "font-size: 17px;"
                + "font-family: 'Roboto-Bold';"
                + "margin-bottom: 10px;"
                + "padding: 10px 12px;"
                + "background: #e8f0fe;"
                + "border-left: 6px solid #4285F4;"
                + "border-radius: 4px;"
                + "} ");

        html.append(".detail-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 6px; }");

        html.append(".detail-table th {"
                + "background: #eef1f7;"
                + "border: 1px solid #d0d4db;"
                + "padding: 10px;"
                + "font-family: 'Roboto-Bold';"
                + "page-break-inside: avoid;"
                + "} ");

        html.append(".detail-table tr { page-break-inside: avoid; }");

        html.append(".detail-table td {"
                + "border: 1px solid #e5e7ec;"
                + "padding: 10px;"
                + "vertical-align: top;"
                + "word-wrap: break-word;"
                + "} ");

        html.append(".detail-table td:nth-child(3) { font-family: 'Roboto-Bold'; color: ").append(DARK_TEXT).append("; }");

        html.append(".detail-table th:nth-child(1), .detail-table td:nth-child(1) { width: 6%; text-align:center; }");
        html.append(".detail-table th:nth-child(2), .detail-table td:nth-child(2) { width: 17%; }");
        html.append(".detail-table th:nth-child(3), .detail-table td:nth-child(3) { width: 25%; }");
        html.append(".detail-table th:nth-child(4), .detail-table td:nth-child(4) { width: 52%; }");

        html.append("</style>");
        html.append("</head>");
        html.append("<body>");


        // =============================================
        //                COVER PAGE CONTENT
        // =============================================

        html.append("<div class='cover-page'>");

        html.append("<div class='cover-title'>").append(escape(tripName)).append("</div>");
        html.append("<div class='cover-subtitle'>— Your Personalized Travel Itinerary —</div>");
        html.append("<div class='cover-divider'></div>");

        html.append("<div class='info-card'>");

        html.append(infoRowDates(formatNumber(trip.getStartDate()), formatNumber(trip.getEndDate())));

        html.append(infoRow("Adults", formatNumber(trip.getNumAdult())));
        html.append(infoRow("Children", formatNumber(trip.getNumChild())));
        html.append(infoRow("Elders", formatNumber(trip.getNumElder())));

        html.append("</div>");

        html.append("<div class='cover-footer'>Plan Generated by AI Travel Planner | Date: ").append(LocalDate.now()).append("</div>");

        html.append("</div>"); // cover-page


        // =============================================
        //             DAY SECTIONS (NO CHANGE)
        // =============================================

        if (trip.getTripSections() != null) {

            for (TripSectionRequest section : trip.getTripSections()) {

                html.append("<div class='day-section'>");

                html.append("<div class='day-title'>Day ").append(section.getDayNumber());
                if (section.getTitle() != null && !section.getTitle().isBlank()) {
                    html.append(" - ").append(escape(section.getTitle()));
                }
                html.append("</div>");

                html.append("<table class='detail-table'>");
                html.append("<thead><tr>");
                html.append("<th>No.</th>");
                html.append("<th>Time</th>");
                html.append("<th>Location</th>");
                html.append("<th>Description</th>");
                html.append("</tr></thead>");
                html.append("<tbody>");

                if (section.getTripDetails() != null) {
                    for (TripDetailRequest detail : section.getTripDetails()) {

                        html.append("<tr>");

                        html.append("<td>").append(detail.getSequenceOrder()).append("</td>");

                        String timeRange = formatTimeRange(detail.getStartTime(), detail.getEndTime());
                        html.append("<td>").append(escape(timeRange)).append("</td>");

                        LocationDTO loc = detail.getLocation();
                        String locName = (loc != null && loc.getLocationName() != null)
                                ? loc.getLocationName() : "Unknown";

                        html.append("<td>").append(escape(locName)).append("</td>");

                        StringBuilder desc = new StringBuilder();

                        // ----------- ĐÃ SỬA ĐỔI TẠI ĐÂY -----------
                        // LOẠI BỎ THÔNG TIN LOCATION (Open Time, Rating, Price)
                        /*
                        if (loc != null) {
                            if (loc.getOpenTime() != null)
                                desc.append("Open: ").append(formatTime(loc.getOpenTime())).append("<br/>");

                            if (loc.getAvgVisitTime() != null)
                                desc.append("Visit: ").append(loc.getAvgVisitTime()).append(" min<br/>");

                            if (loc.getTicketPrice() != null)
                                desc.append("Price: ").append(loc.getTicketPrice()).append("<br/>");

                            if (loc.getAverageRating() != null)
                                desc.append("Rating: ").append(loc.getAverageRating())
                                        .append(" (").append(loc.getReviewCount()).append(" reviews)<br/>");
                        }
                        */
                        // ------------------------------------------

                        // CHỈ GIỮ LẠI ACTIVITY/DESCRIPTION (ghi chú của người dùng)
                        if (detail.getDescription() != null) {
                            // Dùng strong để làm nổi bật activity
                            desc.append("<strong>").append(escape(detail.getDescription())).append("</strong>");
                        }

                        // Nếu activity là null, desc sẽ là chuỗi rỗng

                        html.append("<td>").append(desc).append("</td>");

                        html.append("</tr>");
                    }
                }

                html.append("</tbody></table>");
                html.append("</div>"); // end day-section
            }
        }

        html.append("</body></html>");
        return html.toString();
    }


    // =============================================
    //             SUPPORT: LIST ROW HELPERS
    // =============================================

    private String infoRowDates(String startDate, String endDate) {
        return "<div class='info-row duration'>"
                + "<div class='duration-title'>TRIP DURATION</div>"
                + "<div class='duration-dates-inline'>"

                + "<div class='date-item date-item-flex'>"
                + "<span class='label'>Start Date:</span>"
                + "<span class='value'>" + startDate + "</span>"
                + "</div>"

                + "<div class='date-item date-item-flex'>"
                + "<span class='label'>End Date:</span>"
                + "<span class='value'>" + endDate + "</span>"
                + "</div>"

                + "</div>"
                + "</div>";
    }

    private String infoRow(String label, String value) {
        return "<div class='info-row'>"
                + "<div class='info-label'>" + label + ":</div>"
                + "<div class='info-value'>" + value + "</div>"
                + "</div>";
    }
}
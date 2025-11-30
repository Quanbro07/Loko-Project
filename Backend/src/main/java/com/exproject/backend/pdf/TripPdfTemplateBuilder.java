package com.exproject.backend.pdf;

import com.exproject.backend.location.dto.LocationDTO;
import com.exproject.backend.trip.dto.TripRequest;
import com.exproject.backend.trip_detail.dto.TripDetailRequest;
import com.exproject.backend.trip_section.dto.TripSectionRequest;
import org.springframework.stereotype.Component;

import java.time.LocalTime;

@Component
public class TripPdfTemplateBuilder {

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
        return start + " - " + end;
    }

    private String formatNumber(Object num) {
        return num != null ? num.toString() : "-";
    }

    public String buildHtml(TripRequest trip) {
        String tripName = trip.getTripName() != null ? trip.getTripName() : "Your Trip Plan";

        StringBuilder html = new StringBuilder();

        // ---------- HEADER ----------
        html.append("<!DOCTYPE html>");
        html.append("<html lang='en'>");
        html.append("<head>");
        html.append("<meta charset='UTF-8'/>");
        html.append("<title>").append(escape(tripName)).append("</title>");

        // ---------- CSS ----------
        html.append("<style>");

        html.append("@font-face { font-family: 'Roboto'; src: url('file:src/main/resources/fonts/Roboto-Regular.ttf'); }");
        html.append("@font-face { font-family: 'Roboto-Bold'; src: url('file:src/main/resources/fonts/Roboto-Bold.ttf'); }");

        html.append("body { font-family: 'Roboto', sans-serif; font-size: 13px; line-height: 1.45; padding: 10px 25px; }");

        html.append(".trip-title { font-size: 26px; font-family: 'Roboto-Bold'; color: #222; margin-bottom: 18px; }");

        // ===== NEW TRIP SUMMARY BOX =====
        html.append(".trip-info-box {"
                + "margin: 10px 0 28px 0;"
                + "padding: 22px 26px;"
                + "background: #f5f8ff;"
                + "border: 1px solid #cdd8f0;"
                + "border-radius: 10px;"
                + "width: 65%;"
                + "box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
                + "} ");

        html.append(".trip-info-title {"
                + "font-family: 'Roboto-Bold';"
                + "font-size: 17px;"
                + "margin-bottom: 16px;"
                + "color: #213a7b;"
                + "} ");

        html.append(".trip-info-grid {"
                + "display: grid;"
                + "grid-template-columns: 130px auto;"
                + "row-gap: 10px;"
                + "column-gap: 10px;"
                + "font-size: 14px;"
                + "} ");

        html.append(".trip-info-label { font-family: 'Roboto-Bold'; color: #1e1e1e; }");
        html.append(".trip-info-value { color: #333; }");

        // ===== DAY TITLE =====
        html.append(".day-title {"
                + "font-size: 17px;"
                + "font-family: 'Roboto-Bold';"
                + "margin-top: 25px;"
                + "margin-bottom: 10px;"
                + "padding: 10px 14px;"
                + "background: #e8f0fe;"
                + "border-left: 6px solid #4285F4;"
                + "border-radius: 4px;"
                + "} ");

        // ===== TABLE STYLE =====
        html.append(".detail-table {"
                + "width: 100%;"
                + "border-collapse: collapse;"
                + "margin-top: 6px;"
                + "border: 1px solid #d0d4db;"
                + "border-radius: 8px;"
                + "overflow: hidden;"
                + "table-layout: fixed;"
                + "} ");

        html.append(".detail-table th {"
                + "background: #eef1f7;"
                + "color: #1a2c63;"
                + "padding: 10px;"
                + "font-family: 'Roboto-Bold';"
                + "border: 1px solid #d0d4db;"
                + "} ");

        html.append(".detail-table td {"
                + "padding: 10px;"
                + "border: 1px solid #e5e7ec;"
                + "vertical-align: top;"
                + "} ");

        html.append(".detail-table th:nth-child(1), .detail-table td:nth-child(1) { width: 6%; text-align:center; }");
        html.append(".detail-table th:nth-child(2), .detail-table td:nth-child(2) { width: 18%; }");
        html.append(".detail-table th:nth-child(3), .detail-table td:nth-child(3) { width: 25%; }");
        html.append(".detail-table th:nth-child(4), .detail-table td:nth-child(4) { width: 51%; }");

        html.append("</style>");
        html.append("</head>");
        html.append("<body>");

        // ---------- TRIP TITLE ----------
        html.append("<div class='trip-title'>").append(escape(tripName)).append("</div>");

        // ---------- TRIP SUMMARY ----------
        html.append("<div class='trip-info-box'>");

        html.append("<div class='trip-info-title'>Trip Summary</div>");

        html.append("<div class='trip-info-grid'>");

        html.append("<div class='trip-info-label'>Start date:</div>");
        html.append("<div class='trip-info-value'>").append(formatNumber(trip.getStartDate())).append("</div>");

        html.append("<div class='trip-info-label'>End date:</div>");
        html.append("<div class='trip-info-value'>").append(formatNumber(trip.getEndDate())).append("</div>");

        html.append("<div class='trip-info-label'>Adults:</div>");
        html.append("<div class='trip-info-value'>").append(formatNumber(trip.getNumAdult())).append("</div>");

        html.append("<div class='trip-info-label'>Children:</div>");
        html.append("<div class='trip-info-value'>").append(formatNumber(trip.getNumChild())).append("</div>");

        html.append("<div class='trip-info-label'>Elders:</div>");
        html.append("<div class='trip-info-value'>").append(formatNumber(trip.getNumElder())).append("</div>");

        html.append("</div>");
        html.append("</div>");

        // ---------- DAY SECTIONS ----------
        if (trip.getTripSections() != null) {

            for (TripSectionRequest section : trip.getTripSections()) {

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

                        html.append("<td><strong>").append(escape(locName)).append("</strong></td>");

                        StringBuilder desc = new StringBuilder();

                        if (loc != null) {
                            if (loc.getOpenTime() != null)
                                desc.append("Open: ").append(formatTime(loc.getOpenTime())).append("<br/>");

                            if (loc.getAvgVisitTime() != null)
                                desc.append("Visit: ").append(loc.getAvgVisitTime()).append(" phút<br/>");

                            if (loc.getTicketPrice() != null)
                                desc.append("Price: ").append(loc.getTicketPrice()).append("<br/>");

                            if (loc.getAverageRating() != null)
                                desc.append("Rating: ").append(loc.getAverageRating())
                                        .append(" (").append(loc.getReviewCount()).append(" reviews)<br/>");
                        }

                        if (detail.getDescription() != null)
                            desc.append("<br/><strong>").append(escape(detail.getDescription())).append("</strong>");

                        html.append("<td>").append(desc.toString()).append("</td>");

                        html.append("</tr>");
                    }
                }

                html.append("</tbody></table>");
            }
        }

        html.append("</body></html>");
        return html.toString();
    }
}

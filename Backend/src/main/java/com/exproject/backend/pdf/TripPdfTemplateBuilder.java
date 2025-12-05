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

        // ========== HTML + CSS HEADER ==========
        html.append("<!DOCTYPE html>");
        html.append("<html lang='en'>");
        html.append("<head>");
        html.append("<meta charset='UTF-8'/>");

        html.append("<style>");

        // ---------- FONT ----------
        html.append("@font-face { font-family: 'Roboto'; src: url('file:src/main/resources/fonts/Roboto-Regular.ttf'); }");
        html.append("@font-face { font-family: 'Roboto-Bold'; src: url('file:src/main/resources/fonts/Roboto-Bold.ttf'); }");

        // ---------- GLOBAL ----------
        html.append("body { font-family: 'Roboto', sans-serif; padding: 25px 40px; font-size: 13px; color: #333; }");

        html.append(".header { text-align: center; margin-bottom: 35px; }");
        html.append(".header-title { font-size: 30px; font-family:'Roboto-Bold'; color:#263b5e; }");
        html.append(".header-sub { font-size: 14px; color:#7a7a7a; margin-top:4px; }");

        // ---------- SUMMARY CARD ----------
        html.append(".summary-card { "
                + "padding: 25px; border-radius: 12px; background:#f7f9ff; "
                + "border:1px solid #d6def1; width:72%; margin-bottom:35px; "
                + "box-shadow:0 2px 8px rgba(0,0,0,0.06); "
                + "}");
        html.append(".summary-title { font-size: 18px; font-family:'Roboto-Bold'; margin-bottom:18px; color:#1d2f6f; }");
        html.append(".summary-grid { display:grid; grid-template-columns:150px auto; row-gap:12px; column-gap:15px; }");
        html.append(".label { font-family:'Roboto-Bold'; color:#222; }");
        html.append(".value { color:#555; }");

        // ---------- DAY SECTION ----------
        html.append(".day-section { margin-top:35px; }");
        html.append(".day-header { "
                + "font-size:18px; padding:12px 18px; background:#e3ebff; "
                + "border-left:7px solid #4a6cf7; border-radius:6px; "
                + "font-family:'Roboto-Bold'; color:#1d2f6f;"
                + "}");

        // ---------- TABLE ----------
        html.append(".detail-table { width:100%; margin-top:12px; border-collapse: collapse; "
                + "border-radius: 10px; overflow:hidden; font-size:13px; }");

        html.append(".detail-table th { background:#eff2fb; padding:10px; border:1px solid #d3d8e6; "
                + "font-family:'Roboto-Bold'; text-align:left; color:#1a1a1a; }");

        html.append(".detail-table td { padding:10px; border:1px solid #e5e7ec; vertical-align: top; }");

        html.append(".col-no { width:6%; text-align:center; }");
        html.append(".col-time { width:15%; }");
        html.append(".col-location { width:25%; font-weight:bold; }");
        html.append(".col-desc { width:54%; }");

        html.append("</style>");
        html.append("</head>");
        html.append("<body>");

        // ========== HEADER ==========
        html.append("<div class='header'>");
        html.append("<div class='header-title'>" + escape(tripName) + "</div>");
        html.append("<div class='header-sub'>Generated Trip Plan</div>");
        html.append("</div>");

        // ========== SUMMARY CARD ==========
        html.append("<div class='summary-card'>");
        html.append("<div class='summary-title'>Trip Overview</div>");
        html.append("<div class='summary-grid'>");

        html.append("<div class='label'>Start Date:</div><div class='value'>" + formatNumber(trip.getStartDate()) + "</div>");
        html.append("<div class='label'>End Date:</div><div class='value'>" + formatNumber(trip.getEndDate()) + "</div>");
        html.append("<div class='label'>Adults:</div><div class='value'>" + formatNumber(trip.getNumAdult()) + "</div>");
        html.append("<div class='label'>Children:</div><div class='value'>" + formatNumber(trip.getNumChild()) + "</div>");
        html.append("<div class='label'>Elders:</div><div class='value'>" + formatNumber(trip.getNumElder()) + "</div>");

        html.append("</div></div>");

        // ========== DAY SECTIONS ==========
        if (trip.getTripSections() != null) {
            for (TripSectionRequest section : trip.getTripSections()) {

                html.append("<div class='day-section'>");

                html.append("<div class='day-header'>Day " + section.getDayNumber());
                if (section.getTitle() != null && !section.getTitle().isBlank())
                    html.append(" - " + escape(section.getTitle()));
                html.append("</div>");

                html.append("<table class='detail-table'>");
                html.append("<thead><tr>");
                html.append("<th class='col-no'>No.</th>");
                html.append("<th class='col-time'>Time</th>");
                html.append("<th class='col-location'>Location</th>");
                html.append("<th class='col-desc'>Description</th>");
                html.append("</tr></thead><tbody>");

                if (section.getTripDetails() != null) {
                    for (TripDetailRequest detail : section.getTripDetails()) {

                        html.append("<tr>");

                        html.append("<td class='col-no'>" + detail.getSequenceOrder() + "</td>");

                        String timeRange = formatTimeRange(detail.getStartTime(), detail.getEndTime());
                        html.append("<td class='col-time'>" + escape(timeRange) + "</td>");

                        LocationDTO loc = detail.getLocation();
                        String locName = (loc != null && loc.getLocationName() != null)
                                ? loc.getLocationName() : "Unknown";

                        html.append("<td class='col-location'>" + escape(locName) + "</td>");

                        StringBuilder desc = new StringBuilder();
                        if (loc != null) {
                            if (loc.getOpenTime() != null)
                                desc.append("<div>Open: ").append(formatTime(loc.getOpenTime())).append("</div>");
                            if (loc.getAvgVisitTime() != null)
                                desc.append("<div>Visit: ").append(loc.getAvgVisitTime()).append(" min</div>");
                            if (loc.getTicketPrice() != null)
                                desc.append("<div>Price: ").append(loc.getTicketPrice()).append("</div>");
                            if (loc.getAverageRating() != null)
                                desc.append("<div>Rating: ").append(loc.getAverageRating())
                                        .append(" (" + loc.getReviewCount() + " reviews)</div>");
                        }

                        if (detail.getDescription() != null)
                            desc.append("<br/><strong>").append(escape(detail.getDescription())).append("</strong>");

                        html.append("<td class='col-desc'>" + desc + "</td>");

                        html.append("</tr>");
                    }
                }

                html.append("</tbody></table>");
                html.append("</div>");
            }
        }

        html.append("</body></html>");

        return html.toString();
    }
}

package com.exproject.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Configuration
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain)
        throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwtToken;
        final String userEmail;

        if(authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);

            return;
        }

        jwtToken = authHeader.substring(7);
        userEmail = jwtService.extractUsername(jwtToken);

        // Có userEmail nhưng chưa dc cấp quyền
        if(userEmail != null &&
                SecurityContextHolder.getContext().getAuthentication() == null) {

            // Tìm UserDetails tu userEmail
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // Check token Valid không
            // Useremail giống nhau và token chưa expired
            if(jwtService.isTokenValid(userDetails ,jwtToken)) {

                // Tạo authen Token
                UsernamePasswordAuthenticationToken authenToken =
                        new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                );

                // Set lại các Details từ Request
                authenToken.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );

                // Lưu vào SecurityContextHolder
                SecurityContextHolder.getContext().setAuthentication(authenToken);
            }
        }

        // Tiếp tục filter chain
        filterChain.doFilter(request, response);
    }
}

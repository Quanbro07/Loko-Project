package com.exproject.backend.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    private final String SECRET_KEY = "bvSA188iHf0fK0pfyqbT2LFlVGdP4g4AkiMY1Mbv52EmcSVHJtMCYhnachbPqfMlxM7+cuBK9S6O2J1fXDihtw==";
    private final long ACESS_TOKEN_EXPIRATION = 1000 * 60 * 30; // 30p
    private final long REFRESH_TOKEN_EXPIRATION = 1000 * 60 * 60 * 24; // 24h


    // * Extract All Claims
    public Claims exstractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public<T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = exstractAllClaims(token);

        return claimsResolver.apply(claims);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token,Claims::getExpiration);
    }

    // * Check Token
    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public boolean isTokenValid(UserDetails userDetails, String token) {
        final String username = extractUsername(token);

        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    // Generate Token
    public String generateToken(Map<String, Object> extractClaims,
        UserDetails userDetails,
        long expirationTime) {

        return Jwts.builder()
                .setClaims(extractClaims)
                .setSubject(userDetails.getUsername())
                .signWith(getSignKey())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime)) // 30p
                .compact();
    }

    public String generateAccessToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails,ACESS_TOKEN_EXPIRATION);
    }

    public String generateRefreshToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails,REFRESH_TOKEN_EXPIRATION);
    }

    // Get Sign Key
    private Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }

}

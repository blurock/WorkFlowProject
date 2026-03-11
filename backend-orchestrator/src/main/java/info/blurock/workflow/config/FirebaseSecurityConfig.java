package info.blurock.workflow.config;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class FirebaseSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(org.springframework.security.config.Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authz -> authz
                        // Allow Google Workflows to hit our tasks without a Firebase Token
                        .requestMatchers("/api/tasks/**").permitAll()
                        // All other endpoints require authentication
                        .anyRequest().authenticated())
                .addFilterBefore(new FirebaseAuthFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    public static class FirebaseAuthFilter extends OncePerRequestFilter {

        @Override
        protected boolean shouldNotFilter(HttpServletRequest request) {
            String path = request.getRequestURI();
            return path.startsWith("/api/tasks/");
        }

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                FilterChain filterChain)
                throws ServletException, IOException {

            String header = request.getHeader("Authorization");

            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);
                try {
                    // Very simple token verification setup for demonstration.
                    // In real apps, FirebaseApp needs to be initialized first via ServiceAccount
                    // credentials.
                    FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);

                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            decodedToken.getUid(), null, new ArrayList<>());

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } catch (FirebaseAuthException | IllegalArgumentException | IllegalStateException e) {
                    // Invalid token or Firebase not initialized yet
                    // Will let Spring Security handle the 401 response
                    System.err.println("Firebase Auth Error: " + e.getMessage());
                }
            }

            filterChain.doFilter(request, response);
        }
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:4200", 
                "https://blurock-database.web.app", 
                "https://blurock-database.firebaseapp.com",
                "https://blurock-admin.web.app",
                "https://blurock-admin.firebaseapp.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

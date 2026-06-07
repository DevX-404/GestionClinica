package com.example.GestionClinica.config;

import com.example.GestionClinica.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // Encriptador para proteger contraseñas
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable()) // Desactivamos CSRF porque usaremos JWT tokens
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Permitir acceso libre al endpoint de autenticación (Login/Registro)
                .requestMatchers("/api/auth/**").permitAll()
                
                // REGLAS DEL FLUJO CLÍNICO:
                // 1. Pacientes: ADMIN y RECEPCIONISTA pueden gestionar todo.
                .requestMatchers("/api/pacientes/**").hasAnyRole("ADMINISTRADOR", "RECEPCIONISTA")
                
                // 2. Médicos: Solo el ADMINISTRADOR puede gestionar personal médico.
                .requestMatchers("/api/medicos/**").hasRole("ADMINISTRADOR")
                
                // 3. Citas: RECEPCIONISTA (programa), MEDICO (ve su agenda), ADMIN (todo)
                .requestMatchers("/api/citas/**").hasAnyRole("ADMINISTRADOR", "MEDICO", "RECEPCIONISTA")
                
                // Cualquier otra petición requiere estar logueado
                .anyRequest().authenticated()
            );

        // Inyectamos nuestro filtro de JWT antes del filtro por defecto de Spring
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}

package com.example.GestionClinica.config;

import com.example.GestionClinica.security.JwtAuthenticationFilter;

import java.util.Arrays;
import java.util.List;

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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

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
                .cors(cors -> {
                })
                .csrf(csrf -> csrf.disable()) // Desactivamos CSRF porque usaremos JWT tokens
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Permitir acceso libre al endpoint de autenticación (Login/Registro)
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // REGLAS DEL FLUJO CLÍNICO:
                        // 1. Pacientes: ADMIN y RECEPCIONISTA pueden gestionar todo.
                        .requestMatchers("/api/pacientes/**").hasAnyRole("ADMINISTRADOR", "RECEPCIONISTA")

                        // 2. Médicos: TODOS pueden consultar (GET) la lista de médicos para las citas.
                        .requestMatchers(HttpMethod.GET, "/api/medicos/**")
                        .hasAnyRole("ADMINISTRADOR", "RECEPCIONISTA", "MEDICO")
                        // PERO solo el ADMIN puede modificarlos (POST, PUT, DELETE).
                        .requestMatchers("/api/medicos/**").hasRole("ADMINISTRADOR")

                        // 3. Citas: RECEPCIONISTA (programa), MEDICO (ve su agenda), ADMIN (todo)
                        .requestMatchers("/api/citas/**").hasAnyRole("ADMINISTRADOR", "MEDICO", "RECEPCIONISTA")

                        // 4. Consultas y Recetas son estrictamente del Médico
                        .requestMatchers(HttpMethod.GET, "/api/consultas/**").hasAnyRole("MEDICO", "ADMINISTRADOR")
                        .requestMatchers("/api/consultas/**").hasRole("MEDICO")

                        .requestMatchers(HttpMethod.GET, "/api/recetas/**").hasAnyRole("MEDICO", "ADMINISTRADOR")
                        .requestMatchers("/api/recetas/**").hasRole("MEDICO")

                        // 5. Historia Clínica: El Médico escribe y lee, pero el Administrador podría
                        // necesitar consultarla (GET)
                        .requestMatchers(HttpMethod.GET, "/api/historia-clinica/**")
                        .hasAnyRole("MEDICO", "ADMINISTRADOR")
                        .requestMatchers("/api/historia-clinica/**").hasRole("MEDICO")

                        // 6. Asegurarnos de que los Horarios estén libres para agendar
                        .requestMatchers("/api/horarios/**").hasAnyRole("ADMINISTRADOR", "MEDICO", "RECEPCIONISTA")

                        // 7. Usuarios: Cualquier logueado puede gestionar su propio perfil (GET o POST)
                        .requestMatchers("/api/usuarios/perfil/**").authenticated()
                       // Pero SOLO el administrador gestiona el resto de las cuentas
                        .requestMatchers("/api/usuarios/**").hasRole("ADMINISTRADOR")

                        .requestMatchers("/api/notificaciones/**").authenticated()

                        // 8. Solicitudes: Cualquier usuario puede crear y ver sus solicitudes
                        .requestMatchers("/api/solicitudes/").authenticated()

                        // Permitir el flujo de incidencias a cualquier cuenta autenticada
                        .requestMatchers("/api/incidencias/**").authenticated()

                        // Cualquier otra petición requiere estar logueado
                        .anyRequest().authenticated());

        // Inyectamos nuestro filtro de JWT antes del filtro por defecto de Spring
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Bean de configuración de CORS exclusivo para los filtros de Spring Security
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:4200")); // Origen de tu Angular
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}

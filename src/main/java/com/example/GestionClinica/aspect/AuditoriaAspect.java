package com.example.GestionClinica.aspect;

import com.example.GestionClinica.model.Auditoria;
import com.example.GestionClinica.repository.AuditoriaRepository;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Aspect
@Component
public class AuditoriaAspect {

    @Autowired
    private AuditoriaRepository auditoriaRepository;

    // Intercepta métodos de cualquier clase dentro de 'service' que modifiquen datos
    @AfterReturning(pointcut = "execution(* com.example.GestionClinica.service.*.registrar*(..)) || " +
                               "execution(* com.example.GestionClinica.service.*.actualizar*(..)) || " +
                               "execution(* com.example.GestionClinica.service.*.eliminar*(..)) || " +
                               "execution(* com.example.GestionClinica.service.*.programar*(..)) || " +
                               "execution(* com.example.GestionClinica.service.*.procesar*(..))")
    public void registrarAuditoria(JoinPoint joinPoint) {
        
        String nombreMetodo = joinPoint.getSignature().getName();
        String nombreClase = joinPoint.getTarget().getClass().getSimpleName(); // Ej: PacienteServiceImpl
        
        // Limpiamos el nombre de la clase para sacar la entidad (Ej: PacienteServiceImpl -> Paciente)
        String entidad = nombreClase.replace("ServiceImpl", "").replace("Service", "");

        // Obtenemos el usuario autenticado desde el JWT
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String usuario = (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) 
                            ? auth.getName() : "SISTEMA";

        // Definimos la acción
        String accion = "MODIFICACIÓN";
        if (nombreMetodo.startsWith("registrar") || nombreMetodo.startsWith("programar")) accion = "CREACIÓN";
        if (nombreMetodo.startsWith("actualizar") || nombreMetodo.startsWith("procesar")) accion = "ACTUALIZACIÓN";
        if (nombreMetodo.startsWith("eliminar")) accion = "ELIMINACIÓN LÓGICA";

        Auditoria log = new Auditoria();
        log.setAccion(accion);
        log.setEntidad(entidad);
        log.setFechaHora(LocalDateTime.now());
        log.setUsername(usuario);
        log.setDetalle("Ejecución del método: " + nombreMetodo);

        auditoriaRepository.save(log);
    }
}

package com.example.GestionClinica.controller;

import com.example.GestionClinica.dto.IncidenciaDTO;
import com.example.GestionClinica.service.IncidenciaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidencias")
@CrossOrigin(origins = "http://localhost:4200")
public class IncidenciaController {

    @Autowired private IncidenciaService incidenciaService;

    // Obtener todas las incidencias (Mando TI)
    @GetMapping
    public ResponseEntity<List<IncidenciaDTO>> obtenerTodas() {
        return ResponseEntity.ok(incidenciaService.listarTodas());
    }

    // Obtener incidencias de un empleado específico
    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<IncidenciaDTO>> obtenerPorUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(incidenciaService.listarPorUsuario(idUsuario));
    }

    // Crear un reporte de error vinculado a un usuario
    @PostMapping("/usuario/{idUsuario}")
    public ResponseEntity<IncidenciaDTO> reportarIncidencia(@PathVariable Long idUsuario, @RequestBody IncidenciaDTO dto) {
        return new ResponseEntity<>(incidenciaService.registrarIncidencia(idUsuario, dto), HttpStatus.CREATED);
    }

    // Resolver o cambiar el estado del ticket
    @PatchMapping("/{id}/responder")
    public ResponseEntity<IncidenciaDTO> cambiarEstadoYResponder(
            @PathVariable Long id,
            @RequestParam String estado,
            @RequestBody(required = false) Map<String, String> body) {
        
        String respuestaAdmin = (body != null) ? body.get("respuestaAdmin") : "";
        return ResponseEntity.ok(incidenciaService.cambiarEstadoYResponder(id, estado, respuestaAdmin));
    }
}
package com.example.GestionClinica.controller;

import com.example.GestionClinica.dto.SolicitudDTO;
import com.example.GestionClinica.service.SolicitudService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/solicitudes")
@CrossOrigin(origins = "http://localhost:4200")
public class SolicitudController {

    @Autowired private SolicitudService solicitudService;

    @GetMapping
    public ResponseEntity<List<SolicitudDTO>> listarTodas() {
        return ResponseEntity.ok(solicitudService.listarTodas());
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<SolicitudDTO>> listarPorUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(solicitudService.listarPorUsuario(idUsuario));
    }

    @PostMapping("/usuario/{idUsuario}")
    public ResponseEntity<SolicitudDTO> crearSolicitud(@PathVariable Long idUsuario, @RequestBody SolicitudDTO dto) {
        return ResponseEntity.ok(solicitudService.crearSolicitud(idUsuario, dto));
    }

    @PatchMapping("/{id}/responder")
    public ResponseEntity<SolicitudDTO> responderSolicitud(@PathVariable Long id, @RequestParam String estado, @RequestBody(required = false) String respuesta) {
        return ResponseEntity.ok(solicitudService.responderSolicitud(id, estado, respuesta));
    }
}
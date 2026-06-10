package com.example.GestionClinica.controller;

import com.example.GestionClinica.dto.AuditoriaDTO;
import com.example.GestionClinica.service.AuditoriaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
@CrossOrigin(origins = "http://localhost:4200")
public class AuditoriaController {

    private final AuditoriaService service;

    public AuditoriaController(AuditoriaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<AuditoriaDTO>> listarLogs() {
        return ResponseEntity.ok(service.listarHistorial());
    }
}

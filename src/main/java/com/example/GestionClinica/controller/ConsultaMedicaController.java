package com.example.GestionClinica.controller;

import com.example.GestionClinica.model.ConsultaMedica;
import com.example.GestionClinica.service.ConsultaMedicaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/consultas")
public class ConsultaMedicaController {

    @Autowired private ConsultaMedicaService consultaService;

    // Registrar la atención (Flujo 12, 13, 14, 15 del Médico)
    @PostMapping("/atender-cita/{idCita}")
    public ResponseEntity<ConsultaMedica> registrarAtencion(@PathVariable Long idCita, @RequestBody Map<String, String> body) {
        String sintomas = body.get("sintomas");
        String diagnostico = body.get("diagnostico");
        String observaciones = body.get("observaciones");

        ConsultaMedica nuevaConsulta = consultaService.registrarAtencionMedica(idCita, sintomas, diagnostico, observaciones);
        return new ResponseEntity<>(nuevaConsulta, HttpStatus.CREATED);
    }

    // Ver el historial de consultas de un paciente
    @GetMapping("/paciente/{idPaciente}")
    public ResponseEntity<List<ConsultaMedica>> listarPorPaciente(@PathVariable Long idPaciente) {
        return ResponseEntity.ok(consultaService.listarPorPaciente(idPaciente));
    }
}

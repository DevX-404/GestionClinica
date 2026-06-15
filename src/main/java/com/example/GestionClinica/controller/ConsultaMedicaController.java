package com.example.GestionClinica.controller;

import com.example.GestionClinica.model.ConsultaMedica;
import com.example.GestionClinica.service.ConsultaMedicaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/consultas")
public class ConsultaMedicaController {

    @Autowired private ConsultaMedicaService consultaService;

    // Registrar la atención
    @PostMapping("/atender-cita/{idCita}")
    public ResponseEntity<Map<String, Long>> registrarAtencion(@PathVariable Long idCita, @RequestBody Map<String, String> body) {
        String sintomas = body.get("sintomas");
        
        String diagnostico = body.get("diagnosticoGeneral");
        if (diagnostico == null) {
            diagnostico = body.get("diagnostico");
        }
        
        String tratamiento = body.get("tratamiento");
        String observaciones = body.get("observaciones");

        ConsultaMedica nuevaConsulta = consultaService.registrarAtencionMedica(idCita, sintomas, diagnostico, observaciones, tratamiento);
        
        // SOLUCION DEFINITIVA: Retornar solo el ID de la consulta en un Map. 
        // Esto evita el Error 500 por bucle infinito de Jackson.
        Map<String, Long> response = new HashMap<>();
        response.put("idConsulta", nuevaConsulta.getIdConsulta());

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Ver el historial de consultas de un paciente
    @GetMapping("/paciente/{idPaciente}")
    public ResponseEntity<List<ConsultaMedica>> listarPorPaciente(@PathVariable Long idPaciente) {
        return ResponseEntity.ok(consultaService.listarPorPaciente(idPaciente));
    }
}
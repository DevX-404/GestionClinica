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

    @PostMapping("/atender-cita/{idCita}")
    public ResponseEntity<ConsultaMedica> registrarAtencion(@PathVariable Long idCita, @RequestBody Map<String, String> body) {
        String sintomas = body.get("sintomas");
        
        // Buscamos el diagnóstico como lo envía Angular
        String diagnostico = body.get("diagnosticoGeneral");
        if (diagnostico == null) {
            diagnostico = body.get("diagnostico");
        }
        
        String tratamiento = body.get("tratamiento");
        String observaciones = body.get("observaciones");

        ConsultaMedica nuevaConsulta = consultaService.registrarAtencionMedica(idCita, sintomas, diagnostico, observaciones , tratamiento);
        
        // --- SOLUCIÓN AL ERROR 500 (BUCLE INFINITO) ---
        // Desvinculamos los objetos pesados solo en la respuesta para que Java no explote al crear el JSON.
        nuevaConsulta.setHistoriaClinica(null);
        nuevaConsulta.setCitaMedica(null);
        nuevaConsulta.setMedico(null);

        return new ResponseEntity<>(nuevaConsulta, HttpStatus.CREATED);
    }

    @GetMapping("/paciente/{idPaciente}")
    public ResponseEntity<List<ConsultaMedica>> listarPorPaciente(@PathVariable Long idPaciente) {
        return ResponseEntity.ok(consultaService.listarPorPaciente(idPaciente));
    }
}
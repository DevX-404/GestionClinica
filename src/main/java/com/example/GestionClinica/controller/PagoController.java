package com.example.GestionClinica.controller;

import com.example.GestionClinica.dto.PagoDTO;
import com.example.GestionClinica.service.PagoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
@CrossOrigin(origins = "http://localhost:4200")
public class PagoController {

    @Autowired
    private PagoService pagoService;

    @GetMapping
    public ResponseEntity<List<PagoDTO>> listarTodos() {
        return ResponseEntity.ok(pagoService.listarTodos());
    }

    @GetMapping("/cita/{idCita}")
    public ResponseEntity<PagoDTO> obtenerPorCita(@PathVariable Long idCita) {
        return ResponseEntity.ok(pagoService.obtenerPorCita(idCita));
    }

    // Al confirmar una cita, la recepcionista o el sistema puede invocar este método para inicializar el cobro
    @PostMapping("/generar/{idCita}")
    public ResponseEntity<PagoDTO> generarPagoPendiente(@PathVariable Long idCita) {
        return ResponseEntity.ok(pagoService.generarPagoPendiente(idCita));
    }

    // Cuando el paciente pasa la tarjeta o da el efectivo
    @PostMapping("/procesar/{idPago}")
    public ResponseEntity<PagoDTO> procesarPago(@PathVariable Long idPago, @RequestBody PagoDTO dto) {
        return ResponseEntity.ok(pagoService.procesarPago(idPago, dto));
    }
}

package com.example.GestionClinica.controller;

import com.example.GestionClinica.dto.DashboardDTO;
import com.example.GestionClinica.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:4200")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/metricas")
    public ResponseEntity<DashboardDTO> obtenerMetricas() {
        return ResponseEntity.ok(dashboardService.obtenerMetricasGlobales());
    }
}

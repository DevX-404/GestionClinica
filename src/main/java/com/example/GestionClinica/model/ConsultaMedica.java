package com.example.GestionClinica.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "consultas_medicas")
public class ConsultaMedica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idConsulta;

    @NotNull(message = "La fecha de consulta es obligatoria")
    private LocalDate fechaConsulta = LocalDate.now();

    @NotBlank(message = "El motivo de la consulta no puede estar vacío")
    @Column(nullable = false, length = 255)
    private String motivoConsulta;

    @Column(columnDefinition = "TEXT")
    private String sintomas;

    @NotBlank(message = "El diagnóstico general es obligatorio")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String diagnosticoGeneral;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_historia_clinica", nullable = false)
    private HistoriaClinica historiaClinica;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_cita", nullable = false, unique = true)
    private CitaMedica citaMedica;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_medico", nullable = false)
    private Medico medico;
}

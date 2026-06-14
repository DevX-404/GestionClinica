package com.example.GestionClinica.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "citas_medicas")
public class CitaMedica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idCita;

    @NotNull(message = "El paciente es obligatorio")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_paciente", nullable = false)
    private Paciente paciente;

    @NotNull(message = "El médico es obligatorio")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_medico", nullable = false)
    private Medico medico;

    @NotNull(message = "La especialidad es obligatoria")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_especialidad", nullable = false)
    private Especialidad especialidad;

    @NotNull(message = "La fecha de la cita es obligatoria")
    @FutureOrPresent(message = "La fecha de la cita no puede ser una fecha pasada")
    private LocalDate fecha;

    @NotNull(message = "La hora de la cita es obligatoria")
    private LocalTime hora;

    @NotBlank(message = "El estado de la cita es obligatorio")
    @Column(length = 20, nullable = false)
    private String estado = "PENDIENTE"; // PENDIENTE, CONFIRMADA, ATENDIDA, CANCELADA

    @Column(length = 255)
    private String motivoConsulta;
    // --- NUEVO CAMPO DE DINERO ---
    @Column(precision = 10, scale = 2)
    private BigDecimal montoPagadoAdelanto;
}

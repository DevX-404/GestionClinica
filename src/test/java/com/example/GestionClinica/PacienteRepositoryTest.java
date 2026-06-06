package com.example.GestionClinica;

import com.example.GestionClinica.model.Paciente;
import com.example.GestionClinica.repository.PacienteRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE) // Usa tu BD real de Postgres configurada en el .env
public class PacienteRepositoryTest {

    @Autowired
    private PacienteRepository pacienteRepository;

    @Test
    public void deberiaGuardarYBuscarPacientePorDniActivo() {
        // Arrange (Preparar datos)
        Paciente paciente = new Paciente(null, "DNI", "77441122", "Carlos", "Soto", "Mendoza", 
                LocalDate.of(1995, 5, 12), "MASCULINO", "Av. Balta 123", "987654321", "carlos@mail.com", "ACTIVO");

        // Act (Ejecutar la acción)
        Paciente guardado = pacienteRepository.save(paciente);
        Optional<Paciente> encontrado = pacienteRepository.findByDniActivo("77441122");

        // Assert (Verificar resultados)
        assertThat(guardado.getIdPaciente()).isNotNull();
        assertThat(encontrado).isPresent();
        assertThat(encontrado.get().getNombres()).isEqualTo("Carlos");
    }
}
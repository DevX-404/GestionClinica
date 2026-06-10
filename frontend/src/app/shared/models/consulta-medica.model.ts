export interface ConsultaMedica {
    idConsulta?: number;
    fechaConsulta?: string;
    motivoConsulta: string;
    sintomas: string;
    diagnosticoGeneral: string;
    tratamiento?: string;
    observaciones?: string;
    idHistoriaClinica?: number;
    idCita?: number;
    idMedico?: number;
}
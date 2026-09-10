export type Colaborador = {
  id: number;
  rol: string;
};

export type Revision = {
  aprobado: boolean;
  revisando: boolean;
  razon: string;
  publico: boolean;
  publicadoEn: number;
};

export type PlantillaProyecto = {
  id: number;
  idCreador: number;
  colaboradores: Colaborador[];
  titulo: string;
  descripcion: string;
  revision: Revision;
  archivoDiseño: string;
  diseñoPrerenderizadoHTML: string;
  assets: string[];
};

// Los tipos de arriba fueron hechos rapido con IA
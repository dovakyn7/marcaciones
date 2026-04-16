import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Registro {
  id: string;
  cedula: string;
  tipo_evento: 'entrada' | 'salida';
  created_at: string;
}

export interface FilaReporte {
  fecha: string;
  entrada: string;
  salida: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private readonly TZ = 'America/Bogota';

  constructor() {
    this.supabase = createClient(
      'https://rovgmpemhrbbwpnmvpdr.supabase.co',
      'sb_publishable_hI2kYsTM-Z4zKqjJq64agg_Qt34-cqG'
    );
  }

  async insertarRegistro(data: {
    nombre: string;
    cedula: string;
    tipo_evento: 'entrada' | 'salida';
  }) {
    const { data: empleado } = await this.supabase
      .from('empleados')
      .select('*')
      .eq('cedula', data.cedula)
      .maybeSingle();

    if (!empleado) {
      const { error: errorInsertEmpleado } = await this.supabase
        .from('empleados')
        .insert([{ cedula: data.cedula, nombre: data.nombre.toUpperCase().trim() }]);
      if (errorInsertEmpleado) return { error: errorInsertEmpleado };
    }

    const { error } = await this.supabase
      .from('registros')
      .insert([{ cedula: data.cedula, tipo_evento: data.tipo_evento }]);

    console.log('INSERT REGISTRO ERROR:', error);
    return { error };
  }

  async buscarEmpleado(cedula: string): Promise<{ nombre: string } | null> {
    const { data } = await this.supabase
      .from('empleados')
      .select('nombre')
      .eq('cedula', cedula)
      .maybeSingle();
    return data;
  }

  async obtenerRegistros(cedula: string, desde: Date, hasta: Date): Promise<Registro[]> {
    const hastaFin = new Date(hasta);
    hastaFin.setHours(23, 59, 59, 999);

    const { data, error } = await this.supabase
      .from('registros')
      .select('*')
      .eq('cedula', cedula)
      .gte('created_at', desde.toISOString())
      .lte('created_at', hastaFin.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error obteniendo registros:', error);
      return [];
    }
    return data ?? [];
  }

  private utcToBogotaDate(utcStr: string): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: this.TZ,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date(utcStr));
  }

  private utcToBogotaHora(utcStr: string): string {
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: this.TZ,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(utcStr));
  }

  procesarRegistros(registros: Registro[]): FilaReporte[] {
    const porDia: Record<string, { entrada?: string; salida?: string }> = {};

    for (const reg of registros) {
      // Supabase guarda en UTC sin 'Z' — hay que agregarlo
      const utcStr = reg.created_at.endsWith('Z') ? reg.created_at : reg.created_at + 'Z';
      const fecha = new Date(utcStr);

      const diaKey = fecha.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }); // YYYY-MM-DD
      const horaStr = fecha.toLocaleTimeString('es-CO', {
        timeZone: 'America/Bogota',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      if (!porDia[diaKey]) porDia[diaKey] = {};

      if (reg.tipo_evento === 'entrada') {
        if (!porDia[diaKey].entrada) porDia[diaKey].entrada = horaStr;
      } else {
        porDia[diaKey].salida = horaStr;
      }
    }

    return Object.entries(porDia)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([diaKey, { entrada, salida }]) => {
        const [year, month, day] = diaKey.split('-');
        const fechaDisplay = `${day}/${month}/${year}`;
        let horas_trabajadas = '—';

        if (entrada && salida) {
          const e = this.parseHora(entrada);
          const s = this.parseHora(salida);
          if (s > e) {
            const diff = s - e;
            const h = Math.floor(diff / 60);
            const m = diff % 60;
            horas_trabajadas = `${h}h ${m.toString().padStart(2, '0')}m`;
          }
        }

        return { fecha: fechaDisplay, entrada: entrada ?? '—', salida: salida ?? '—', horas_trabajadas };
      });
  }
  private parseHora(horaStr: string): number {
    const clean = horaStr.replace(/\s/g, '').toLowerCase();
    const match = clean.match(/(\d+):(\d+)(a\.?m\.?|p\.?m\.?)/);
    if (!match) return 0;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const periodo = match[3].replace(/\./g, '');
    if (periodo === 'pm' && h !== 12) h += 12;
    if (periodo === 'am' && h === 12) h = 0;
    return h * 60 + m;
  }
}
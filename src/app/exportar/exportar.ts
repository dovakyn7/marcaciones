import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService, FilaReporte } from '../services/services';
import * as XLSX from 'xlsx';

type Rango = 'hoy' | 'ayer' | 'semana' | 'quincena' | 'mes' | 'personalizado';

@Component({
  selector: 'app-reporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exportar.html',
  styleUrls: ['./exportar.css'],
})
export class ReporteComponent {
  cedula = '';
  rango: Rango = 'semana';
  fechaDesde = '';
  fechaHasta = '';

  nombreEmpleado = '';
  filas: FilaReporte[] = [];
  cargando = false;
  error = '';
  buscado = false;

  readonly opciones: { valor: Rango; label: string }[] = [
    { valor: 'hoy',           label: 'Hoy' },
    { valor: 'ayer',          label: 'Ayer' },
    { valor: 'semana',        label: 'Última semana' },
    { valor: 'quincena',      label: 'Última quincena' },
    { valor: 'mes',           label: 'Último mes' },
    { valor: 'personalizado', label: 'Personalizado' },
  ];

  constructor(private supa: SupabaseService) {}

  get esPersonalizado() { return this.rango === 'personalizado'; }

  get diasConRegistro(): number {
    return this.filas.filter(f => f.entrada !== '—').length;
  }

  private calcularRango(): { desde: Date; hasta: Date } {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hasta = new Date();

    switch (this.rango) {
      case 'hoy':
        return { desde: hoy, hasta };
      case 'ayer': {
        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);
        const ayerFin = new Date(ayer);
        ayerFin.setHours(23, 59, 59, 999);
        return { desde: ayer, hasta: ayerFin };
      }
      case 'semana': {
        const inicio = new Date(hoy);
        inicio.setDate(inicio.getDate() - 6);
        return { desde: inicio, hasta };
      }
      case 'quincena': {
        const inicio = new Date(hoy);
        inicio.setDate(inicio.getDate() - 14);
        return { desde: inicio, hasta };
      }
      case 'mes': {
        const inicio = new Date(hoy);
        inicio.setDate(inicio.getDate() - 29);
        return { desde: inicio, hasta };
      }
      case 'personalizado':
        return {
          desde: this.fechaDesde ? new Date(this.fechaDesde + 'T00:00:00') : hoy,
          hasta: this.fechaHasta ? new Date(this.fechaHasta + 'T23:59:59') : hasta,
        };
    }
  }

  async buscar() {
    if (!this.cedula.trim()) { this.error = 'Ingresa una cédula.'; return; }
    if (this.rango === 'personalizado' && (!this.fechaDesde || !this.fechaHasta)) {
      this.error = 'Selecciona las fechas del rango personalizado.'; return;
    }

    this.cargando = true;
    this.error = '';
    this.filas = [];
    this.buscado = false;

    const empleado = await this.supa.buscarEmpleado(this.cedula.trim());
    if (!empleado) {
      this.error = 'No se encontró ningún empleado con esa cédula.';
      this.cargando = false;
      return;
    }

    this.nombreEmpleado = empleado.nombre;
    const { desde, hasta } = this.calcularRango();
    const registros = await this.supa.obtenerRegistros(this.cedula.trim(), desde, hasta);
    this.filas = this.supa.procesarRegistros(registros);
    this.cargando = false;
    this.buscado = true;
  }

  exportarExcel() {
    if (!this.filas.length) return;

    const datos = this.filas.map(f => ({
      Fecha: f.fecha,
      Entrada: f.entrada,
      Salida: f.salida,
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    ws['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 14 }];
    XLSX.writeFile(wb, `reporte_${this.cedula}_${Date.now()}.xlsx`);
  }

  limpiar() {
    this.cedula = '';
    this.rango = 'semana';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.nombreEmpleado = '';
    this.filas = [];
    this.error = '';
    this.buscado = false;
  }
}
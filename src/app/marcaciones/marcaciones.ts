
import { Component } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../services/services';

@Component({
  selector: 'app-marcaciones',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './marcaciones.html',
  styleUrl: './marcaciones.css',
})
export class Marcaciones {

  loading = false;


  form!: any;
  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      cedula: ['', Validators.required],
      tipo_evento: [null, Validators.required],
    });
  }

  async enviar() {
    if (this.form.invalid) return;

    this.loading = true;

    const { nombre, cedula, tipo_evento } = this.form.value;

    const { error } = await this.supabase.insertarRegistro({
      nombre,
      cedula,
      tipo_evento,
    });

    this.loading = false;

    if (error) {
      alert('Error al registrar');
      console.error('ERROR COMPLETO:', error);
      console.log('DATA ENVIADA:', { nombre, cedula, tipo_evento });
    } else {
      alert('Registro exitoso');
      this.form.reset({ tipo_evento: null });
    }
    console.log('Enviando:', this.form.value);

  }
}

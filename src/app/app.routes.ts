import { Routes } from '@angular/router';
import { Marcaciones } from './marcaciones/marcaciones';
import { ReporteComponent } from './exportar/exportar';
//import { Exportar } from './exportar/exportar';

export const routes: Routes = [
  { path: '', component: Marcaciones },
  { path: 'exportar', component: ReporteComponent },
  { path: '**', redirectTo: '' }
];
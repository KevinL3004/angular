import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EscuelaList } from './pages/escuela-list/escuela-list';

const routes: Routes = [{ path: '', component: EscuelaList }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EscuelasRoutingModule { }
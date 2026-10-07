import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlanList } from './pages/plan-list/plan-list';
import { CompraList } from './pages/compra-list/compra-list';
import { ProveedorList } from './pages/proveedor-list/proveedor-list';

const routes: Routes = [
  { path: '', component: PlanList },
  { path: 'realizadas', component: CompraList },
  { path: 'proveedores', component: ProveedorList },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class ComprasRoutingModule { }
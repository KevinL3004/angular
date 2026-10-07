import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InventarioList } from './pages/inventario-list/inventario-list';

const routes: Routes = [{ path: '', component: InventarioList }];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class InventarioRoutingModule { }
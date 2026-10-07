import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LiquidacionList } from './pages/liquidacion-list/liquidacion-list';

const routes: Routes = [{ path: '', component: LiquidacionList }];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class LiquidacionesRoutingModule { }
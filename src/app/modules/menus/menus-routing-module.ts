import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MenuList } from './pages/menu-list/menu-list';
import { AlimentoList } from './pages/alimento-list/alimento-list';

const routes: Routes = [
  { path: '', component: MenuList },
  { path: 'alimentos', component: AlimentoList },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class MenusRoutingModule { }
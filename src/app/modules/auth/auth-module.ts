import { NgModule } from '@angular/core';
import { AuthRoutingModule } from './auth-routing-module';
import { Login } from './pages/login/login';

@NgModule({
  imports: [AuthRoutingModule, Login],
})
export class AuthModule { }
import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LoginComponent } from './features/login/login.component';
import { SignupComponent } from './features/signup/signup.component';
import { VerifyEmailComponent } from './features/verify-email/verify-email.component';
import { AnomaliesComponent } from './features/anomalies/anomalies.component';
import { MissionsComponent } from './features/missions/missions.component';
import { KilometrageComponent } from './features/kilometrage/kilometrage.component';
import { InspectionComponent } from './features/inspection/inspection.component';
import { TeleoperationComponent } from './features/teleportation/teleportation.component';
import { DockingComponent } from './features/docking/docking.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'mission', component: MissionsComponent, canActivate: [authGuard] },
  { path: 'anomalies', component: AnomaliesComponent, canActivate: [authGuard] },
  { path: 'kilometrage', component: KilometrageComponent, canActivate: [authGuard] },
  { path: 'inspection', component: InspectionComponent, canActivate: [authGuard] },
  { path: 'teleportation', component: TeleoperationComponent, canActivate: [authGuard] },
  { path: 'docking', component: DockingComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' },
];

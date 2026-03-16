import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { HomeComponent } from './components/home/home';
import { DatastoreTermsComponent } from './components/datastore-terms/datastore-terms';
import { TermExtractionComponent } from './components/term-extraction/term-extraction';
import { FillInOntologyComponent } from './components/fill-in-ontology/fill-in-ontology';
import { ExtractDescriptionComponent } from './components/extract-description/extract-description';
import { PrimitiveShowcaseComponent } from './components/primitives/showcase/primitive-showcase';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'home', component: HomeComponent },
    { path: 'datastore-terms', component: DatastoreTermsComponent },
    { path: 'term-extraction', component: TermExtractionComponent },
    { path: 'fill-in-ontology', component: FillInOntologyComponent },
    { path: 'extract-description', component: ExtractDescriptionComponent },
    { path: 'primitives', component: PrimitiveShowcaseComponent },
];

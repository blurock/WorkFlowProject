import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home').then(m => m.HomeComponent)
  },
  {
    path: 'datastore-terms',
    loadComponent: () => import('./features/catalog/datastore-terms/datastore-terms').then(m => m.DatastoreTermsComponent)
  },
  {
    path: 'term-extraction',
    loadComponent: () => import('./features/term-extraction/term-extraction/term-extraction').then(m => m.TermExtractionComponent)
  },
  {
    path: 'fill-in-ontology',
    loadComponent: () => import('./features/catalog/fill-in-ontology/fill-in-ontology').then(m => m.FillInOntologyComponent)
  },
  {
    path: 'extract-description',
    loadComponent: () => import('./features/term-extraction/extract-description/extract-description').then(m => m.ExtractDescriptionComponent)
  },
  {
    path: 'primitives',
    loadComponent: () => import('./features/catalog/primitives/showcase/primitive-showcase').then(m => m.PrimitiveShowcaseComponent)
  },
  {
    path: 'primitives/dynamic-primitive-test',
    loadComponent: () => import('./features/catalog/primitives/showcase/dynamic-primitive-test').then(m => m.DynamicPrimitiveTestComponent)
  },
  {
    path: 'molecule-editor',
    loadComponent: () => import('./features/molecule-editor/ketcher-editor.component').then(m => m.KetcherEditorComponent)
  },
  {
    path: 'workflow-task/:uid/:sessionId',
    loadComponent: () => import('./features/workflow/workflow-task/workflow-task').then(m => m.WorkflowTaskComponent)
  },
  {
    path: 'run-transaction',
    loadComponent: () => import('./features/workflow/run-transaction/run-transaction').then(m => m.RunTransactionComponent)
  },
  {
    path: 'run-transaction/:uid/:sessionId',
    loadComponent: () => import('./features/workflow/run-transaction/run-transaction').then(m => m.RunTransactionComponent)
  },
  {
    path: 'test-live-catalog-object',
    loadComponent: () => import('./features/catalog/primitives/showcase/test-live-catalog-object').then(m => m.TestLiveCatalogObjectComponent)
  },
];

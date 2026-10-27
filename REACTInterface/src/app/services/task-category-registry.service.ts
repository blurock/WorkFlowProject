import { Injectable } from '@angular/core';
import { TaskCategory } from '../models/task-category.models';

@Injectable({
  providedIn: 'root'
})
export class TaskCategoryRegistry {

  public readonly CATEGORIES: TaskCategory[] = [
    {
      id: 'explore',
      title: 'Explore & Inspect Data',
      description: 'Search and inspect database catalog items, chemical structures, and thermodynamic data',
      icon: 'manage_search',
      badge: 'EXPLORE',
      badgeColor: 'primary',
      isExpanded: true,
      tasks: [
        {
          id: 'molecules',
          title: 'Molecules List',
          inpFile: 'PrintMoleculeList.inp',
          description: 'Retrieve catalog of molecules from REACT database',
          icon: 'science',
          type: 'catalog-view'
        },
        {
          id: 'rxn-patterns',
          title: 'Reaction Patterns',
          inpFile: 'PrintRxnPatternsList.inp',
          description: 'Retrieve catalog of reaction patterns and kinetics templates',
          icon: 'schema',
          type: 'catalog-view'
        },
        {
          id: 'substructures',
          title: 'Sub-Structures',
          inpFile: 'PrintSubStructures.inp',
          description: 'Retrieve catalog of chemical sub-structures',
          icon: 'grain',
          type: 'catalog-view'
        },
        {
          id: 'benson-groups',
          title: 'Benson Groups',
          inpFile: 'PrintBensonList.inp',
          description: 'Retrieve catalog of Benson thermodynamic group contributions',
          icon: 'thermostat',
          type: 'catalog-view'
        },
        {
          id: 'mechanisms',
          title: 'Mechanisms List',
          inpFile: 'PrintMechanismList.inp',
          description: 'Retrieve catalog of reaction mechanisms from REACT database',
          icon: 'account_tree',
          type: 'catalog-view'
        }
      ]
    },
    {
      id: 'db-operations',
      title: 'Database Operations',
      description: 'Search, verify, and register chemical structures and database records',
      icon: 'dns',
      badge: 'DATABASE',
      badgeColor: 'primary',
      isExpanded: true,
      tasks: [
        {
          id: 'search-structure-db',
          title: 'Search Structure in Database',
          description: 'Draw 2D chemical structure in Ketcher to query database for exact isomorphism and retrieve ID/Name',
          icon: 'saved_search',
          type: 'search-structure'
        },
        {
          id: 'read-check-store-db',
          title: 'Read, Check & Store Database Input',
          description: 'Upload source files, verify existence, and commit structures to database in 3 steps',
          icon: 'cloud_upload',
          type: 'read-check-store'
        }
      ]
    },
    {
      id: 'create',
      title: 'Create & Generate',
      description: 'Generate reaction mechanisms, build reaction pathways, and define custom species',
      icon: 'auto_awesome',
      badge: 'CREATE',
      badgeColor: 'accent',
      isExpanded: true,
      tasks: [
        {
          id: 'submechanism-from-path',
          title: 'Submechanism from Path',
          inpFile: 'CallChain.inp',
          description: 'Generate complete mechanism from molecule and mechanism pathway in Firestore',
          icon: 'alt_route',
          type: 'submechanism-creator'
        },
        {
          id: 'submechanism-path-set',
          title: 'Submechanism Path Set',
          inpFile: 'CallChain.inp',
          description: 'Generate a set of submechanisms for a molecule across multiple mechanism pathways in Firestore',
          icon: 'account_tree',
          type: 'submechanism-path-set'
        },
        {
          id: 'combine-submechanisms',
          title: 'Combine Submechanisms',
          inpFile: 'CombineMechanisms.inp',
          description: 'Combine a list of submechanisms (50-100+) into a single unified mechanism',
          icon: 'merge_type',
          type: 'combine-submechanisms'
        },
        {
          id: 'test-reaction-pattern',
          title: 'Test Reaction Pattern',
          inpFile: 'CallChain.inp',
          description: 'Execute and test reaction patterns on a drawn molecule with auxiliary radicals',
          icon: 'biotech',
          type: 'test-reaction-pattern'
        },
        {
          id: 'generate-mechanism',
          title: 'Mechanism Generator',
          description: 'Generate kinetic mechanisms from reactant sets and elementary rules',
          icon: 'account_tree',
          type: 'interactive-creator'
        },
        {
          id: 'build-rxn-pattern',
          title: 'Reaction Pattern Generator',
          description: 'Draw reaction template in Ketcher, assign atom correspondences, generate class patterns & store in REACT database',
          icon: 'hub',
          type: 'rxn-pat-generator'
        },
        {
          id: 'read-check-store-db',
          title: 'Read, Check & Store Database Input',
          description: 'Upload source files, verify existence, and commit structures to database in 3 steps',
          icon: 'cloud_upload',
          type: 'read-check-store'
        },
        {
          id: 'mechanism-pathway-creator',
          title: 'Mechanism Pathway Creator',
          description: 'Visually create, edit, check, and store reaction mechanism pathways in Firestore',
          icon: 'polyline',
          type: 'mechanism-pathway-creator'
        },
        {
          id: 'read-mol-properties',
          title: 'Read Molecule Properties from File',
          inpFile: 'ReadInMoleculeProperties.inp',
          description: 'Input molecule properties file (ROOTNAME.lst) to data/mol/molsdf and read properties into database',
          icon: 'upload_file',
          type: 'generic-file-input'
        },
        {
          id: 'read-sdf-molecules',
          title: 'Read SDF Molecules',
          inpFile: 'ReadMoleculesFromFile.inp',
          description: 'Input SDF molecule structure file (ROOTNAME.sdf) to data/mol/molsdf and read structures into database',
          icon: 'science',
          type: 'generic-file-input'
        },
        {
          id: 'create-molecule',
          title: 'Molecule Creator & Editor',
          description: 'Draw 2D chemical structures in Ketcher and register in REACT database',
          icon: 'add_circle',
          type: 'graphical-molecule-input'
        }
      ]
    },
    {
      id: 'simulation',
      title: 'Simulation & Kinetics',
      description: 'Ignition delay, flame speed calculation, and kinetic modeling',
      icon: 'insights',
      badge: 'FUTURE',
      badgeColor: 'warn',
      isExpanded: false,
      tasks: [
        {
          id: 'ignition-delay',
          title: 'Ignition Delay Simulator',
          description: 'Simulate shock tube ignition delay times for chemical mechanisms',
          icon: 'timer',
          type: 'interactive-creator'
        },
        {
          id: 'flame-speed',
          title: 'Laminar Flame Speed',
          description: 'Calculate 1D laminar flame speeds across equivalence ratios',
          icon: 'local_fire_department',
          type: 'interactive-creator'
        }
      ]
    }
  ];

  public getAllCategories(): TaskCategory[] {
    return this.CATEGORIES;
  }
}

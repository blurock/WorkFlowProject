export interface CatalogTask {
  id: string;
  title: string;
  inpFile?: string;
  description: string;
  icon: string;
  type: 'catalog-view' | 'interactive-creator' | 'submechanism-creator' | 'submechanism-path-set' | 'combine-submechanisms' | 'generic-file-input';
}

export interface TaskCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge: string;
  badgeColor: 'primary' | 'accent' | 'warn';
  isExpanded?: boolean;
  tasks: CatalogTask[];
}

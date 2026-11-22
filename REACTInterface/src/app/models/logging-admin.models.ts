export interface LogFileItem {
  filename: string;
  gcsFilename?: string;
  fileType: 'log' | 'script' | 'format_check_report' | 'artifact' | 'mol_file' | 'sdf_file';
  sizeBytes: number;
  gcsPath: string;
  downloadUrl?: string;
  createdAt?: string;
}

export interface LogExecutionSummary {
  filename: string;
  gcsPath: string;
  downloadUrl?: string;
  sizeBytes: number;
  lineCount?: number;
  errorSnippet?: string;
}

export interface JobCategoryTaxonomyItem {
  jobCategory: string;
  label: string;
  defaultAccessMode: 'read-only' | 'db-modifying';
  subCategoryField: string;
  targetField: string;
  signatureFormat: string;
}

export interface LogJobDocument {
  jobId: string;
  sessionId: string;
  userId: string;
  userEmail?: string;
  timestamp: string;
  datePartition: string;
  year?: string;
  month?: string;
  day?: string;
  accessMode: 'read-only' | 'db-modifying';
  jobCategory: string;
  catalogLabel?: string;
  subCategory?: string;
  targetName?: string;
  jobSignature?: string;
  molecule?: string;
  rootName?: string;
  mechName?: string;
  inputFile?: string;
  root?: string;
  targetItem?: string;
  isReadOnly?: boolean;
  gcsPrefix: string;
  rawGcsPrefix?: string;
  docPath?: string;
  totalSizeBytes: number;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  executionLog?: LogExecutionSummary | null;
  files: LogFileItem[];
  artifacts?: string[];
}

export interface LogTreeNode {
  id: string;
  label: string;
  path: string;
  type: 'user' | 'logs' | 'accessMode' | 'year' | 'month' | 'day' | 'category' | 'subCategory' | 'jobGroup' | 'job';
  children?: LogTreeNode[];
  data?: LogJobDocument;
  isExpanded?: boolean;
  count?: number;
  accessMode?: 'read-only' | 'db-modifying';
  jobCategory?: string;
  jobSignature?: string;
  status?: 'SUCCESS' | 'FAILED' | 'RUNNING';
  timestamp?: string;
  supersededJobs?: LogJobDocument[];
  showSuperseded?: boolean;
}

export interface LogFilterQuery {
  accessMode?: 'all' | 'read-only' | 'db-modifying';
  jobCategory?: string;
  status?: 'all' | 'SUCCESS' | 'FAILED';
  dateStart?: string;
  dateEnd?: string;
  userId?: string;
  userEmail?: string;
  searchTerm?: string;
  latestOnly?: boolean;
}

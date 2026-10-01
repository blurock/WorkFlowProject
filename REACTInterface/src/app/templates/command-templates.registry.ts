/**
 * Angular Static Template Registry (Option A: Client-Side Templates)
 *
 * Provides static template generator functions for catalog listing and parameterized
 * item lookup commands without relying on backend disk file templates or temp files.
 */
export class CommandTemplatesRegistry {

  // Catalog Task Templates

  public static moleculesCatalog(): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Start", "Quit",
      "DbaseOps", "Molecules", "Misc", "PrintList", "Quit", "Quit", "Quit", "Quit"
    ];
  }

  public static rxnPatternsCatalog(): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Start", "Quit",
      "DbaseOps", "RxnPatterns", "Misc", "PrintList", "Quit", "Quit", "Quit", "Quit"
    ];
  }

  public static substructuresCatalog(): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Start", "Quit",
      "DbaseOps", "SubStructures", "Misc", "PrintList", "Quit", "Quit", "Quit", "Quit"
    ];
  }

  public static bensonCatalog(rootName: string = 'job1'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Start", "Quit",
      "DbaseOps", "Benson", "Parameters", "TablesDataBensonRoot", "Input", "BensonStandard", "Quit", "Quit",
      "ReadList", "Print", "Quit", "Quit",
      "Tables", "Benson", "Parameters", "TablesDataBensonRoot", "Input", rootName, "Quit", "Quit",
      "AtomTranslation", "Read", "Quit", "Quit",
      "Benson", "BensonTables", "Print", "Quit", "Quit", "Quit", "Quit", "Quit", "Quit"
    ];
  }

  public static mechanismsCatalog(): string[] {
    return [
      "CreateOpenClose", "Start", "Quit",
      "DbaseOps", "Mechanisms", "List", "Quit", "Quit", "Quit"
    ];
  }

  // Parameterized Detail Templates (Unmodified static command sequences matching .inp files)

  public static printMoleculeDetail(_moleculeRootName?: string): string[] {
    const rootName = _moleculeRootName || "xxx";
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Start", "Quit",
      "Mol", "Parameters", "MolDirectory", "Input", ".", "Quit",
      "RootMolName", "Input", "molecule", "Quit", "Quit", "Quit",
      "DbaseOps", "Parameters", "DBDataDirectory", "Input", ".", "Quit", "Quit",
      "Molecules", "Parameters", "DBDataMolRoot", "Input", rootName, "Quit", "Quit",
      "Current", "Help", "ReadInCurrent", "Quit", "Quit", "Quit",
      "Mol", "Output", "Molecules", "Print", "Quit", "Quit", "Quit", "Quit"
    ];
  }

  public static printRxnPatternDetail(_rxnPatternRootName?: string): string[] {
    const rootName = _rxnPatternRootName || "xxx";
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Start", "Quit",
      "DbaseOps", "Parameters", "DBDataDirectory", "Input", ".", "Quit", "Quit",
      "RxnPatterns", "Parameters", "DBDataRxnRoot", "Input", rootName, "Quit", "Quit",
      "Current", "ReadInCurrent", "Quit", "Quit", "Quit",
      "Rxn", "Parameters", "RxnDirectory", "Input", ".", "Quit",
      "RootRxnName", "Input", rootName, "Quit", "Quit",
      "Output", "RxnPatterns", "Print", "Quit", "Quit", "Quit", "Quit"
    ];
  }

  public static printSubstructureDetail(_substructureRootName?: string): string[] {
    const rootName = _substructureRootName || "xxx";
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Start", "Quit",
      "Mol", "Parameters", "MolDirectory", "Input", ".", "Quit",
      "RootMolName", "Input", "molecule", "Quit", "Quit", "Quit",
      "DbaseOps", "Parameters", "DBDataDirectory", "Input", ".", "Quit", "Quit",
      "SubStructures", "Parameters", "DBDataMolRoot", "Input", rootName, "Quit", "Quit",
      "Current", "ReadInCurrent", "Quit", "Quit", "Quit",
      "Mol", "Output", "SubStructures", "Print", "Quit", "Quit", "Quit", "Quit"
    ];
  }

  public static printMechanismDetail(_mechanismName?: string): string[] {
    const rootName = _mechanismName || "xxx";
    return [
      "CreateOpenClose", "Start", "Quit",
      "DbaseOps", "Mechanisms", "Parameters", "MechDirectory", "Input", ".", "Quit",
      "RootMechName", "Input", rootName, "Quit", "Quit",
      "Retrieve", "Print", "Quit", "Quit", "Quit"
    ];
  }

  // Generic File Input Task Templates

  public static readMoleculeProperties(rootName: string = '22dimethylC3C4'): string[] {
    return [
      "CreateOpenClose", "Initialize", "Quit",
      "DbaseOps", "Molecules", "Parameters", "DBDataMolRoot", "Input", `mol/molsdf/${rootName}`, "Quit", "Quit",
      "Current", "ASCII", "Store", "Quit",
      "Quit", "Quit"
    ];
  }

  public static readSdfMolecules(rootName: string = '22dimethylC3C4'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "Mol", "Parameters", "MolOutName", "Input", rootName, "Quit",
      "RootMolName", "Input", `molsdf/${rootName}`, "Quit", "Quit",
      "Read", "Molecules", "SDF", "Quit", "Quit",
      "Calculations", "Molecules", "SemiEmpirical", "Quit", "Quit",
      "Output", "Molecules", "Print", "Quit", "Quit", "Quit",
      "DbaseOps", "Molecules", "Current", "Store", "Quit", "Quit", "Quit",
      "Mol", "Output", "Molecules", "Print", "Quit", "Quit",
      "Graph", "PrintGraph", "Quit", "Quit", "Quit",
      "Quit"
    ];
  }

  // --- Read-Check-Store 3-Step Database File Input Templates ---

  // 1. Molecules (SDF / Molfile)
  public static readMoleculesFromFile(rootName: string = 'job1', outName: string = 'out1'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "Mol", "Parameters", "MolOutName", "Input", outName, "Quit",
      "RootMolName", "Input", rootName, "Quit",
      "MolDirectory", "Input", ".", "Quit", "Quit",
      "Read", "Molecules", "SDF", "Quit", "Quit",
      "Calculations", "Molecules", "SemiEmpirical", "Quit", "Quit",
      "Output", "Molecules", "Print", "Quit", "Quit", "Quit",
      "Quit"
    ];
  }

  public static checkMoleculesInDatabase(rootName: string = 'job1', outName: string = 'out1'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Initialize", "Quit",
      "Mol", "Parameters", "MolOutName", "Input", outName, "Quit",
      "RootMolName", "Input", rootName, "Quit",
      "MolDirectory", "Input", ".", "Quit", "Quit",
      "Read", "Molecules", "SDF", "Quit", "Quit",
      "Calculations", "Molecules", "SemiEmpirical", "Quit", "Quit",
      "Output", "Molecules", "Print", "Quit", "Quit", "Quit",
      "DbaseOps", "Molecules", "Current", "ExistenceCheck", "Quit", "Quit", "Quit",
      "Quit", "Quit", "Quit"
    ];
  }

  public static storeMoleculesInDatabase(rootName: string = 'job1', outName: string = 'out1'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Initialize", "Quit",
      "Mol", "Parameters", "MolOutName", "Input", outName, "Quit",
      "RootMolName", "Input", rootName, "Quit",
      "MolDirectory", "Input", ".", "Quit", "Quit",
      "Read", "Molecules", "SDF", "Quit", "Quit",
      "Calculations", "Molecules", "SemiEmpirical", "Quit", "Quit",
      "Output", "Molecules", "Print", "Quit", "Quit", "Quit",
      "DbaseOps", "Molecules", "Current", "Store", "Quit", "Quit", "Quit",
      "Quit", "Quit", "Quit"
    ];
  }

  // 2. Substructures (SDF / Molfile)
  public static readSubstructuresFromFile(rootName: string = 'job1'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "Mol", "Parameters", "RootMolName", "Input", rootName, "Quit",
      "MolDirectory", "Input", ".", "Quit", "Quit",
      "Read", "SubStructures", "SDF", "Quit", "Quit",
      "Calculations", "SubStructures", "SemiEmpirical", "Quit", "Quit",
      "Output", "SubStructures", "Print", "Quit", "Quit",
      "Quit", "Quit", "Quit"
    ];
  }

  public static checkSubstructuresInDatabase(rootName: string = 'job1'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Initialize", "Quit",
      "Mol", "Parameters", "RootMolName", "Input", rootName, "Quit",
      "MolDirectory", "Input", ".", "Quit", "Quit",
      "Read", "SubStructures", "SDF", "Quit", "Quit",
      "Calculations", "SubStructures", "SemiEmpirical", "Quit", "Quit",
      "Output", "SubStructures", "Print", "Quit", "Quit", "Quit",
      "DbaseOps", "SubStructures", "Current", "ExistenceCheck", "Quit", "Quit", "Quit",
      "Quit", "Quit", "Quit"
    ];
  }

  public static storeSubstructuresInDatabase(rootName: string = 'job1'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Initialize", "Quit",
      "Mol", "Parameters", "RootMolName", "Input", rootName, "Quit",
      "MolDirectory", "Input", ".", "Quit", "Quit",
      "Read", "SubStructures", "SDF", "Quit", "Quit",
      "Calculations", "SubStructures", "SemiEmpirical", "Quit", "Quit",
      "Output", "SubStructures", "Print", "Quit", "Quit", "Quit",
      "DbaseOps", "SubStructures", "Current", "Store", "Quit", "Quit", "Quit",
      "Quit", "Quit", "Quit"
    ];
  }

  // 3. Reaction Patterns (ASCII & Molfile/SDF)
  public static readRxnPatternsASCII(rootName: string = 'job1', outName: string = 'out1'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Start", "Quit",
      "Rxn", "Parameters", "RootRxnName", "Input", rootName, "Quit",
      "RxnDirectory", "Input", ".", "Quit",
      "RxnOutName", "Input", outName, "Quit",
      "RxnOutDir", "Input", ".", "Quit", "Quit",
      "Read", "RxnPatterns", "FormatCheck", "Quit", "Quit", "Quit", "Quit"
    ];
  }

  public static readRxnPatternsMolFile(rootName: string = 'job1', outName: string = 'out1'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Start", "Quit",
      "Rxn", "Parameters", "RootRxnName", "Input", rootName, "Quit",
      "RxnDirectory", "Input", ".", "Quit",
      "RxnOutName", "Input", outName, "Quit",
      "RxnOutDir", "Input", ".", "Quit", "Quit",
      "Read", "RxnPatterns", "MolFiles", "Quit", "Quit",
      "Output", "RxnPatterns", "Print", "Quit", "Quit", "Quit", "Quit", "Quit", "Quit"
    ];
  }

  public static checkRxnPatternsInDatabase(rootName: string = 'job1', outName: string = 'out1'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Start", "Quit",
      "Rxn", "Parameters", "RootRxnName", "Input", rootName, "Quit",
      "RxnDirectory", "Input", ".", "Quit",
      "RxnOutName", "Input", outName, "Quit",
      "RxnOutDir", "Input", ".", "Quit", "Quit",
      "RxnPatterns", "ExistenceCheck", "Quit",
      "Quit", "Quit"
    ];
  }

  public static storeRxnPatternsInDatabase(rootName: string = 'job1', outName: string = 'out1'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Start", "Quit",
      "Rxn", "Parameters", "RootRxnName", "Input", rootName, "Quit",
      "RxnDirectory", "Input", ".", "Quit",
      "RxnOutName", "Input", outName, "Quit",
      "RxnOutDir", "Input", ".", "Quit", "Quit",
      "RxnPatterns", "Store", "Quit",
      "Quit", "Quit"
    ];
  }

  // 4. Reactions (ASCII & Molfile/SDF)
  public static readReactionsASCII(rootName: string = 'job1', outName: string = 'out1'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Start", "Quit",
      "Rxn", "Parameters", "RootRxnName", "Input", rootName, "Quit",
      "RxnDirectory", "Input", ".", "Quit",
      "RxnOutName", "Input", outName, "Quit",
      "RxnOutDir", "Input", ".", "Quit", "Quit",
      "Read", "Reactions", "FormatCheck", "Quit", "Quit", "Quit", "Quit"
    ];
  }

  public static readReactionsMolFile(rootName: string = 'job1', outName: string = 'out1'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Start", "Quit",
      "Rxn", "Parameters", "RootRxnName", "Input", rootName, "Quit",
      "RxnDirectory", "Input", ".", "Quit",
      "RxnOutName", "Input", outName, "Quit",
      "RxnOutDir", "Input", ".", "Quit", "Quit",
      "Read", "Reactions", "MolFiles", "Quit", "Quit",
      "Output", "Reactions", "Print", "Quit", "Quit", "Quit", "Quit", "Quit", "Quit"
    ];
  }

  public static checkReactionsInDatabase(rootName: string = 'job1', outName: string = 'out1'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Start", "Quit",
      "Rxn", "Parameters", "RootRxnName", "Input", rootName, "Quit",
      "RxnDirectory", "Input", ".", "Quit",
      "RxnOutName", "Input", outName, "Quit",
      "RxnOutDir", "Input", ".", "Quit", "Quit",
      "Reactions", "ExistenceCheck", "Quit", "Quit", "Quit"
    ];
  }

  public static storeReactionsInDatabase(rootName: string = 'job1', outName: string = 'out1'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Start", "Quit",
      "Rxn", "Parameters", "RootRxnName", "Input", rootName, "Quit",
      "RxnDirectory", "Input", ".", "Quit",
      "RxnOutName", "Input", outName, "Quit",
      "RxnOutDir", "Input", ".", "Quit", "Quit",
      "Reactions", "Store", "Quit", "Quit", "Quit"
    ];
  }

  public static readAndStoreChemkin(rootName: string = '22dimethylC3C4'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Initialize", "Quit",
      "DbaseOps", "Parameters", "DBDataDirectory", "Input", ".", "Quit", "Quit",
      "Molecules", "Parameters", "DBDataMolRoot", "Input", rootName, "Quit", "Quit",
      "Current", "ReadInCurrent", "Quit", "Quit", "Quit",
      "Tables", "Parameters", "TablesDataDirectory", "Input", ".", "Quit",
      "TablesOutputDirectory", "Input", ".", "Quit", "Quit",
      "Chemkin", "Parameters", "TablesDataChemkinRoot", "Input", rootName, "Quit", "Quit",
      "Read", "Quit", "Quit",
      "DbaseOps", "Chemkin", "Store", "Fill", "Quit", "Quit",
      "Mol", "Output", "Molecules", "Print", "Quit", "Quit", "Quit",
      "DbaseOps", "Molecules", "Current", "Store", "Quit", "Quit", "Quit",
      "DbaseOps", "Chemkin", "Store", "Quit", "Quit",
      "Quit"
    ];
  }

  public static readSubsFromFile(rootName: string = 'job1'): string[] {
    return [
      "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
      "MetaAtoms", "Read", "Quit", "Quit",
      "CreateOpenClose", "Initialize", "Quit",
      "Mol", "Parameters", "RootMolName", "Input", `subs/${rootName}`, "Quit", "Quit",
      "Read", "SubStructures", "SDF", "Quit", "Quit",
      "Calculations", "SubStructures", "SemiEmpirical", "Quit", "Quit",
      "Output", "SubStructures", "Print", "Quit", "Quit", "Quit",
      "DbaseOps", "SubStructures", "Current", "Store", "Quit",
      "Misc", "PrintList", "Quit",
      "Quit", "Quit", "Quit"
    ];
  }

  /**
   * Universal Dispatcher for 3-Step Read-Check-Store Commands
   */
  public static getReadCheckStoreCommands(
    dataType: string,
    step: 'read' | 'check' | 'store',
    format: string = 'sdf',
    rootName: string = 'job1',
    outName: string = 'out1'
  ): string[] {
    const isMolFile = format.toLowerCase() === 'molfile' || format.toLowerCase() === 'sdf';
    switch (dataType.toLowerCase()) {
      case 'molecule':
      case 'molecules':
        if (step === 'read') return this.readMoleculesFromFile(rootName, outName);
        if (step === 'check') return this.checkMoleculesInDatabase(rootName, outName);
        return this.storeMoleculesInDatabase(rootName, outName);

      case 'substructure':
      case 'substructures':
        if (step === 'read') return this.readSubstructuresFromFile(rootName);
        if (step === 'check') return this.checkSubstructuresInDatabase(rootName);
        return this.storeSubstructuresInDatabase(rootName);

      case 'rxn-pattern':
      case 'rxnpattern':
      case 'rxn-patterns':
        if (step === 'read') {
          return isMolFile ? this.readRxnPatternsMolFile(rootName, outName) : this.readRxnPatternsASCII(rootName, outName);
        }
        if (step === 'check') return this.checkRxnPatternsInDatabase(rootName, outName);
        return this.storeRxnPatternsInDatabase(rootName, outName);

      case 'reaction':
      case 'reactions':
      case 'rxn':
        if (step === 'read') {
          return isMolFile ? this.readReactionsMolFile(rootName, outName) : this.readReactionsASCII(rootName, outName);
        }
        if (step === 'check') return this.checkReactionsInDatabase(rootName, outName);
        return this.storeReactionsInDatabase(rootName, outName);

      default:
        return this.readMoleculesFromFile(rootName, outName);
    }
  }

  /**
   * Helper mapping task ID + root name to generic task command array generator
   */
  public static getTaskCommands(taskId: string, rootName: string = '22dimethylC3C4'): string[] {
    switch (taskId) {
      case 'read-mol-properties':
        return this.readMoleculeProperties(rootName);
      case 'read-sdf-molecules':
        return this.readMoleculesFromFile(rootName, rootName + '_out');
      case 'read-and-store-chemkin':
      case 'read-chemkin':
        return this.readAndStoreChemkin(rootName);
      case 'read-subs-from-file':
      case 'read-subs':
        return this.readSubstructuresFromFile(rootName);
      case 'molecules':
        return this.moleculesCatalog();
      case 'rxn-patterns':
        return this.rxnPatternsCatalog();
      case 'substructures':
        return this.substructuresCatalog();
      case 'benson-groups':
        return this.bensonCatalog(rootName);
      case 'mechanisms':
        return this.mechanismsCatalog();
      default:
        return this.readMoleculeProperties(rootName);
    }
  }

  /**
   * Helper mapping task ID to static catalog template generator
   */
  public static getCatalogCommands(taskId: string): string[] {
    switch (taskId) {
      case 'molecules':
        return this.moleculesCatalog();
      case 'rxn-patterns':
        return this.rxnPatternsCatalog();
      case 'substructures':
        return this.substructuresCatalog();
      case 'benson-groups':
        return this.bensonCatalog();
      case 'mechanisms':
        return this.mechanismsCatalog();
      default:
        return this.moleculesCatalog();
    }
  }

  /**
   * Helper mapping task ID + item name to parameterized detail command array generator
   */
  public static getItemDetailCommands(taskId: string, itemName: string): string[] {
    switch (taskId) {
      case 'molecules':
        return this.printMoleculeDetail(itemName);
      case 'rxn-patterns':
        return this.printRxnPatternDetail(itemName);
      case 'substructures':
        return this.printSubstructureDetail(itemName);
      case 'benson-groups':
        return this.bensonCatalog();
      case 'mechanisms':
        return this.printMechanismDetail(itemName);
      default:
        return ["CreateOpenClose", "Start", "Quit", "DbaseOps", "Quit", "Quit"];
    }
  }
}


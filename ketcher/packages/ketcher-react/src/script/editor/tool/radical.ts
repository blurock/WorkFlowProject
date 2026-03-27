/****************************************************************************
 * Copyright 2021 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************/

import { Atom, fromAtomsAttrs, FunctionalGroup } from 'ketcher-core';
import Editor from '../Editor';
import { Tool } from './Tool';

// Ketcher radical enum values (from struct-schema.js):
// enum:      [0,  2,           1,                   3                ]
// enumNames: ['', 'Monoradical', 'Diradical (singlet)', 'Diradical (triplet)']
// Note: 2 = Monoradical (one dot), 1 = Diradical singlet, 3 = Diradical triplet
// We toggle between 0 (no radical) and 2 (monoradical) on each click.

class RadicalTool implements Tool {
  private readonly editor: Editor;

  constructor(editor: Editor) {
    this.editor = editor;
    this.editor.selection(null);
  }

  mousemove(event) {
    const struct = this.editor.render.ctab;
    const molecule = struct.molecule;
    const ci = this.editor.findItem(event, ['atoms']);
    const atom = ci && ci.map === 'atoms' ? molecule.atoms.get(ci.id) : null;
    if (atom && this.isRadicalableAtom(atom)) {
      this.editor.hover(ci);
    } else {
      this.editor.hover(null, null, event);
    }
    return true;
  }

  click(event) {
    const editor = this.editor;
    const struct = this.editor.render.ctab;
    const molecule = struct.molecule;
    const functionalGroups = molecule.functionalGroups;
    const rnd = editor.render;
    const ci = editor.findItem(event, ['atoms', 'bonds']);
    const atomResult: Array<number> = [];
    const result: Array<number> = [];

    if (ci && functionalGroups.size && ci.map === 'atoms') {
      const atomId = FunctionalGroup.atomsInFunctionalGroup(
        functionalGroups,
        ci.id,
      );
      const isAtomSuperatomLeavingGroup = Atom.isSuperatomLeavingGroupAtom(
        molecule,
        ci.id,
      );
      if (isAtomSuperatomLeavingGroup) {
        return;
      }

      if (atomId !== null) {
        atomResult.push(atomId);
      }
    }

    if (atomResult.length > 0) {
      for (const id of atomResult) {
        const fgId = FunctionalGroup.findFunctionalGroupByAtom(
          functionalGroups,
          id,
        );

        if (fgId !== null && !result.includes(fgId)) {
          result.push(fgId);
        }
      }
      if (result.length > 0) {
        this.editor.event.removeFG.dispatch({ fgIds: result });
        return;
      }
    }

    if (ci && ci.map === 'atoms') {
      const atom = molecule.atoms.get(ci.id);
      if (atom && this.isRadicalableAtom(atom)) {
        this.editor.hover(ci);
        // Toggle: if radical is already set, clear it back to 0; otherwise set to 2 (monoradical)
        const currentRadical = atom.radical ?? 0;
        const newRadical = currentRadical !== 0 ? 0 : 2;
        this.editor.update(
          fromAtomsAttrs(
            rnd.ctab,
            ci.id,
            {
              radical: newRadical,
            },
            null,
          ),
        );
      }
    }
    return true;
  }

  private isRadicalableAtom(atom: Atom): boolean {
    // Allow radicals on regular atoms, same rule as charge
    return !atom.atomList && !atom.rglabel;
  }
}

export default RadicalTool;

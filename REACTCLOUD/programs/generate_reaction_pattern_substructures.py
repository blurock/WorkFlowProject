#!/usr/bin/env python3
"""
Script to extract reactant and product substructures for each reaction pattern
listed in ReactionPatternSummary.csv and output a 7-column table:

Columns:
  1: Reaction Pattern Name
  2: Reactant 1
  3: Reactant 2
  4: Reactant 3
  5: Product 1
  6: Product 2
  7: Product 3

Outputs generated in REACTCLOUD/programs:
  - ReactionPatternSubstructure.csv (Flat CSV format)
  - ReactionPatternSubstructure.xls (HTML-based Excel file with styled headers and clean grid)
  - ReactionPatternSubstructure.md  (Markdown table format)
  - ReactionPatternSubstructure     (Plain flat CSV format)
"""

import os
import sys
import csv
from collections import defaultdict

# -----------------------------------------------------------------------------
# Path Resolution
# -----------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REACTCLOUD_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))

REACTROOT = os.environ.get("REACTROOT", REACTCLOUD_DIR)
RXNPATS_DIR = os.path.join(REACTROOT, "data", "rxn", "rxnpats")
SUMMARY_CSV_PATH = os.path.join(REACTROOT, "programs", "ReactionPatternSummary.csv")
OUTPUT_DIR = os.path.join(REACTROOT, "programs")

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------
def extract_file_equations(fname):
    """Extract equations for all reaction patterns in a .lst file."""
    path = os.path.join(RXNPATS_DIR, fname)
    results = {}
    if not os.path.exists(path):
        return results
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    blocks = content.split("$$$$")
    for block in blocks:
        lines = block.strip().splitlines()
        pname = None
        eq_line = None
        
        for line in lines:
            l = line.strip()
            if not l or l.startswith("%"):
                continue
            
            if pname is None and not l.startswith("-") and not l.startswith(">"):
                l_clean = l.rstrip("\\").strip()
                parts = l_clean.split()
                if parts:
                    first_tok = parts[0]
                    if not first_tok.startswith("Standard") and not first_tok.startswith("Type"):
                        pname = first_tok
                        if " = " in l_clean:
                            eq_line = l_clean[len(pname):].strip()
                            break
            elif eq_line is None and " = " in l:
                eq_line = l.rstrip("\\").strip()
                break
                
        if pname and eq_line and " = " in eq_line:
            left, right = eq_line.split(" = ", 1)
            reactants = [r.strip() for r in left.strip().split() if r.strip() != "+" and r.strip() != ""]
            products = [p.strip() for p in right.strip().split() if p.strip() != "+" and p.strip() != ""]
            results[pname] = (reactants, products)
            
    return results

# -----------------------------------------------------------------------------
# Main Generation Workflow
# -----------------------------------------------------------------------------
def main():
    if not os.path.exists(SUMMARY_CSV_PATH):
        print(f"Error: {SUMMARY_CSV_PATH} not found. Please run generate_reaction_pattern_summary.py first.", file=sys.stderr)
        sys.exit(1)

    print(f"Reading patterns from: {SUMMARY_CSV_PATH}")
    pattern_entries = []
    with open(SUMMARY_CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if len(row) >= 3:
                fname = row[0].strip()
                pname = row[2].strip()
                pattern_entries.append((fname, pname))

    file_eq_cache = {}
    table_rows = []

    for fname, pname in pattern_entries:
        if fname not in file_eq_cache:
            file_eq_cache[fname] = extract_file_equations(fname)
        
        eq_data = file_eq_cache[fname].get(pname, ([], []))
        reactants, products = eq_data
        
        r1 = reactants[0] if len(reactants) > 0 else ""
        r2 = reactants[1] if len(reactants) > 1 else ""
        r3 = reactants[2] if len(reactants) > 2 else ""
        
        p1 = products[0] if len(products) > 0 else ""
        p2 = products[1] if len(products) > 1 else ""
        p3 = products[2] if len(products) > 2 else ""
        
        table_rows.append([pname, r1, r2, r3, p1, p2, p3])

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    headers = ["Reaction Pattern Name", "Reactant 1", "Reactant 2", "Reactant 3", "Product 1", "Product 2", "Product 3"]

    # 1. Write ReactionPatternSubstructure.csv
    flat_csv_path = os.path.join(OUTPUT_DIR, "ReactionPatternSubstructure.csv")
    with open(flat_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for row in table_rows:
            writer.writerow(row)

    # 2. Write ReactionPatternSubstructure.xls (HTML Excel)
    xls_path = os.path.join(OUTPUT_DIR, "ReactionPatternSubstructure.xls")
    with open(xls_path, "w", encoding="utf-8") as f:
        f.write("""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
  th { background-color: #1F497D; color: white; font-weight: bold; border: 1px solid #95B3D7; padding: 6px 12px; text-align: left; }
  td { border: 1px solid #D9D9D9; padding: 5px 10px; vertical-align: top; }
  tr:nth-child(even) { background-color: #F2F5F8; }
  .pname { font-weight: bold; color: #002060; }
  .sub-item { font-family: Consolas, monospace; font-size: 10pt; }
</style>
</head>
<body>
<table>
<thead>
  <tr>
    <th>Reaction Pattern Name</th>
    <th>Reactant 1</th>
    <th>Reactant 2</th>
    <th>Reactant 3</th>
    <th>Product 1</th>
    <th>Product 2</th>
    <th>Product 3</th>
  </tr>
</thead>
<tbody>
""")
        for row in table_rows:
            f.write('  <tr>\n')
            f.write('    <td class="pname">' + row[0] + '</td>\n')
            for col in row[1:]:
                f.write('    <td class="sub-item">' + col + '</td>\n')
            f.write('  </tr>\n')
        f.write("""</tbody>
</table>
</body>
</html>
""")

    # 3. Write ReactionPatternSubstructure.md
    md_path = os.path.join(OUTPUT_DIR, "ReactionPatternSubstructure.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# Reaction Pattern Substructures\n\n")
        f.write("| " + " | ".join(headers) + " |\n")
        f.write("| " + " | ".join(["---"] * len(headers)) + " |\n")
        for row in table_rows:
            f.write("| " + " | ".join(row) + " |\n")

    # 4. Write ReactionPatternSubstructure plain file
    summary_plain_path = os.path.join(OUTPUT_DIR, "ReactionPatternSubstructure")
    with open(summary_plain_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for row in table_rows:
            writer.writerow(row)

    print("ReactionPatternSubstructure generation complete:")
    print(f"  Processed {len(table_rows)} reaction patterns into 7 columns.")
    print(f"  ReactionPatternSubstructure.csv: {flat_csv_path}")
    print(f"  ReactionPatternSubstructure.xls: {xls_path}")
    print(f"  ReactionPatternSubstructure.md:  {md_path}")
    print(f"  ReactionPatternSubstructure:     {summary_plain_path}")

if __name__ == "__main__":
    main()

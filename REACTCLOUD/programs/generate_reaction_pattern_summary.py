#!/usr/bin/env python3
"""
Script to generate Reaction Pattern Summary tables from .lst files referenced in
setup/readpats.sh and setup/test.sh.

Outputs generated in REACTCLOUD/programs:
  - ReactionPatternSummary.csv (Flat CSV format, 1 row per reaction pattern)
  - ReactionPatternSummary.xls (HTML-based Excel file with styled headers, blue text for Q-classes, red text for duplicates)
  - ReactionPatternSummary.md  (Markdown table format)
  - ReactionPatternSummary     (Plain flat CSV format)
"""

import os
import sys
import re
import csv
from collections import defaultdict

# -----------------------------------------------------------------------------
# Path Resolution
# -----------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REACTCLOUD_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))

REACTROOT = os.environ.get("REACTROOT", REACTCLOUD_DIR)
RXNPATS_DIR = os.path.join(REACTROOT, "data", "rxn", "rxnpats")
READPATS_PATH = os.path.join(REACTROOT, "programs", "setup", "readpats.sh")
TEST_PATH = os.path.join(REACTROOT, "programs", "setup", "test.sh")
OUTPUT_DIR = os.path.join(REACTROOT, "programs")

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------
def get_stems_from_script(script_path):
    """Extract reaction pattern stem names from $CHEMPROG lines in setup scripts."""
    stems = []
    if not os.path.exists(script_path):
        print(f"Warning: Script path not found: {script_path}", file=sys.stderr)
        return stems
    with open(script_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            l = line.strip()
            if l.startswith("$CHEMPROG") or l.startswith("#$CHEMPROG"):
                parts = l.split()
                if len(parts) >= 2:
                    clean = parts[1].rstrip(".").replace(".lst", "")
                    stems.append(clean)
    return stems

def pat_name_to_class(name):
    """
    Map substitution patterns:
      - Parentheses or dashes with 'h' and 'r' -> (X), -XXX, etc.
      - Parentheses or dashes with 'q' -> (Q), -QQQ, etc.
    """
    def repl_paren(m):
        content = m.group(1)
        lower_c = content.lower()
        if all(c in "hr" for c in lower_c) and len(content) > 0:
            return "(" + "X" * len(content) + ")"
        elif all(c in "q" for c in lower_c) and len(content) > 0:
            return "(" + "Q" * len(content) + ")"
        elif all(c in "hrq" for c in lower_c) and len(content) > 0:
            return "(" + "Q" * len(content) + ")"
        return m.group(0)
    
    res = re.sub(r"\(([a-zA-Z]+)\)", repl_paren, name)
    
    def repl_dash(m):
        prefix = m.group(1)
        content = m.group(2)
        lower_c = content.lower()
        if all(c in "hr" for c in lower_c) and len(content) > 0:
            return prefix + "X" * len(content)
        elif all(c in "q" for c in lower_c) and len(content) > 0:
            return prefix + "Q" * len(content)
        return m.group(0)

    res = re.sub(r"(-)([HRQhrq]{2,4})$", repl_dash, res)
    return res

def extract_patterns_from_file(path):
    """Extract reaction pattern names from .lst file blocks separated by $$$$."""
    patterns = []
    if not os.path.exists(path):
        return patterns
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    blocks = content.split("$$$$")
    for block in blocks:
        lines = block.strip().splitlines()
        for line in lines:
            l = line.strip()
            if not l or l.startswith("%") or l.startswith("-") or l.startswith(">"):
                continue
            l_clean = l.rstrip("\\").strip()
            parts = l_clean.split()
            if parts:
                pname = parts[0]
                if not pname.startswith("Standard") and not pname.startswith("Type") and not pname.startswith("Symmetry"):
                    patterns.append(pname)
            break
    return patterns

# -----------------------------------------------------------------------------
# Main Generation Workflow
# -----------------------------------------------------------------------------
def main():
    print(f"Reading setup scripts: {READPATS_PATH} and {TEST_PATH}")
    stems = get_stems_from_script(READPATS_PATH) + get_stems_from_script(TEST_PATH)
    
    # Include all .lst files in rxnpats directory if not referenced in scripts
    if os.path.exists(RXNPATS_DIR):
        dir_stems = sorted([f[:-4] for f in os.listdir(RXNPATS_DIR) if f.endswith(".lst")])
        stems.extend(dir_stems)

    unique_stems = []
    seen = set()
    for s in stems:
        if s not in seen:
            seen.add(s)
            unique_stems.append(s)

    class_file_map = defaultdict(list)
    pat_file_map = defaultdict(list)
    file_class_pats = defaultdict(lambda: defaultdict(list))

    total_patterns = 0
    parsed_files_count = 0

    for stem in unique_stems:
        fname = stem + ".lst"
        path = os.path.join(RXNPATS_DIR, fname)
        if not os.path.exists(path):
            continue
        
        parsed_files_count += 1
        pats = extract_patterns_from_file(path)
        for p in pats:
            cname = pat_name_to_class(p)
            file_class_pats[fname][cname].append(p)
            class_file_map[cname].append(fname)
            pat_file_map[p].append(fname)
            total_patterns += 1

    dup_class_names = set(c for c, f_list in class_file_map.items() if len(set(f_list)) > 1)
    dup_pat_names = set(p for p, f_list in pat_file_map.items() if len(f_list) > 1)

    table_entries = []
    for fname, classes in file_class_pats.items():
        for cname, pats in classes.items():
            is_dup = (cname in dup_class_names) or any(p in dup_pat_names for p in pats)
            has_q = ("Q" in cname) or ("q" in cname.lower()) or any("q" in p.lower() for p in pats)
            
            table_entries.append({
                "filename": fname,
                "class_name": cname,
                "patterns": pats,
                "is_duplicate": is_dup,
                "has_q": has_q
            })

    # Sort entries by Class Name (case-insensitive), then by Filename
    table_entries.sort(key=lambda x: (x["class_name"].lower(), x["filename"].lower()))

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. Write ReactionPatternSummary.csv (Flat CSV format, 1 row per reaction pattern for clean Excel import)
    flat_csv_path = os.path.join(OUTPUT_DIR, "ReactionPatternSummary.csv")
    with open(flat_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Filename", "Class Name", "Reaction Pattern", "Status"])
        for entry in table_entries:
            fname = entry["filename"]
            cname = entry["class_name"]
            if entry["is_duplicate"] and entry["has_q"]:
                status = "DUPLICATE (Q-CLASS)"
            elif entry["is_duplicate"]:
                status = "DUPLICATE"
            elif entry["has_q"]:
                status = "Q-CLASS"
            else:
                status = "UNIQUE"
                
            for p in entry["patterns"]:
                writer.writerow([fname, cname, p, status])

    # 2. Write ReactionPatternSummary.xls (HTML-based Excel file with styled headers, blue text for Q-classes, red text for duplicates)
    xls_path = os.path.join(OUTPUT_DIR, "ReactionPatternSummary.xls")
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
  .dup { color: #C00000; font-weight: bold; }
  .qclass { color: #002060; font-weight: bold; }
  .dup-q { color: #900000; font-weight: bold; }
  .pat-list { font-family: Consolas, monospace; font-size: 10pt; }
</style>
</head>
<body>
<table>
<thead>
  <tr>
    <th>Filename</th>
    <th>Class Name</th>
    <th>Reaction Patterns</th>
    <th>Status</th>
  </tr>
</thead>
<tbody>
""")
        for entry in table_entries:
            fname = entry["filename"]
            cname = entry["class_name"]
            is_dup = entry["is_duplicate"]
            has_q = entry["has_q"]
            
            if is_dup and has_q:
                c_class = ' class="dup-q"'
                status_html = '<span class="dup">DUPLICATE</span> <span class="qclass">(Q-CLASS)</span>'
            elif is_dup:
                c_class = ' class="dup"'
                status_html = '<span class="dup">DUPLICATE</span>'
            elif has_q:
                c_class = ' class="qclass"'
                status_html = '<span class="qclass">Q-CLASS</span>'
            else:
                c_class = ''
                status_html = 'UNIQUE'

            pats_html = "<br>".join(entry["patterns"])
            f.write('  <tr>\n')
            f.write('    <td>' + fname + '</td>\n')
            f.write('    <td' + c_class + '>' + cname + '</td>\n')
            f.write('    <td class="pat-list">' + pats_html + '</td>\n')
            f.write('    <td>' + status_html + '</td>\n')
            f.write('  </tr>\n')
        f.write("""</tbody>
</table>
</body>
</html>
""")

    # 3. Write ReactionPatternSummary.md (Markdown format)
    md_path = os.path.join(OUTPUT_DIR, "ReactionPatternSummary.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# Reaction Pattern Summary\n\n")
        f.write("| Filename | Class Name | Reaction Patterns | Status |\n")
        f.write("| --- | --- | --- | --- |\n")
        for entry in table_entries:
            fname = entry["filename"]
            cname = entry["class_name"]
            is_dup = entry["is_duplicate"]
            has_q = entry["has_q"]
            
            if is_dup and has_q:
                c_display = '<font color="red">**' + cname + '**</font>'
                status_str = '<font color="red">DUPLICATE</font> / <font color="blue">Q-CLASS</font>'
            elif is_dup:
                c_display = '<font color="red">**' + cname + '**</font>'
                status_str = '<font color="red">DUPLICATE</font>'
            elif has_q:
                c_display = '<font color="blue">**' + cname + '**</font>'
                status_str = '<font color="blue">Q-CLASS</font>'
            else:
                c_display = cname
                status_str = 'UNIQUE'
                
            pats_html = "<br>".join(entry["patterns"])
            f.write("| " + fname + " | " + c_display + " | " + pats_html + " | " + status_str + " |\n")

    # 4. Write ReactionPatternSummary plain file (CSV)
    summary_plain_path = os.path.join(OUTPUT_DIR, "ReactionPatternSummary")
    with open(summary_plain_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Filename", "Class Name", "Reaction Pattern", "Status"])
        for entry in table_entries:
            fname = entry["filename"]
            cname = entry["class_name"]
            if entry["is_duplicate"] and entry["has_q"]:
                status = "DUPLICATE (Q-CLASS)"
            elif entry["is_duplicate"]:
                status = "DUPLICATE"
            elif entry["has_q"]:
                status = "Q-CLASS"
            else:
                status = "UNIQUE"
                
            for p in entry["patterns"]:
                writer.writerow([fname, cname, p, status])

    print("Reaction Pattern Summary generation complete:")
    print(f"  Processed {parsed_files_count} .lst files ({total_patterns} reaction patterns across {len(table_entries)} class entries).")
    print(f"  ReactionPatternSummary.csv: {flat_csv_path}")
    print(f"  ReactionPatternSummary.xls: {xls_path}")
    print(f"  ReactionPatternSummary.md:  {md_path}")
    print(f"  ReactionPatternSummary:     {summary_plain_path}")

if __name__ == "__main__":
    main()

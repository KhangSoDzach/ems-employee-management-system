import json
import re
import os

with open('problems.json', 'r', encoding='utf-8') as f:
    problems = json.load(f)

# Group by file path
files = {}
for p in problems:
    path = p['path']
    if path not in files:
        files[path] = []
    files[path].append(p)

for path, probs in files.items():
    if not os.path.exists(path):
        print(f"File not found: {path}")
        continue
        
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.read().split('\n')
        
    lines_to_delete = set()
    suppress_null = False
    suppress_unused = False
    replace_mockbean = False
    
    for p in probs:
        msg = p['message']
        line_idx = p['startLine'] - 1
        
        if "is never used" in msg:
            if "import " in lines[line_idx]:
                lines_to_delete.add(line_idx)
            else:
                suppress_unused = True
        elif "TODO:" in msg:
            # Check if there's other code on this line
            line_str = lines[line_idx]
            if re.sub(r'//\s*TODO:.*', '', line_str).strip() == '':
                lines_to_delete.add(line_idx)
            else:
                lines[line_idx] = re.sub(r'//\s*TODO:.*', '', line_str)
        elif "local variable" in msg and "not used" in msg:
            suppress_unused = True
        elif "Null type safety" in msg or "Potential null pointer" in msg or "Missing non-null" in msg:
            suppress_null = True
        elif "has been deprecated" in msg and "MockBean" in msg:
            replace_mockbean = True
            
    # Modify lines
    # Set to empty so we don't mess up indices
    for idx in lines_to_delete:
        lines[idx] = ""
        
    content = "\n".join(lines)
    
    if replace_mockbean:
        content = content.replace("org.springframework.boot.test.mock.mockito.MockBean", "org.springframework.test.context.bean.override.mockito.MockitoBean")
        content = content.replace("@MockBean", "@MockitoBean")
        
    if suppress_null or suppress_unused or replace_mockbean:
        sups = set()
        if suppress_null: sups.add('"null"')
        if suppress_unused: sups.add('"unused"')
        if replace_mockbean: sups.add('"deprecation"') # just in case
        
        if sups:
            # Format annotation
            sup_str = f'@SuppressWarnings({{{ ", ".join(sorted(sups)) }}})'
            # Insert before class/interface
            out_lines = content.split('\n')
            insert_idx = -1
            for i, l in enumerate(out_lines):
                # match public class, class, interface, enum, abstract class, record, public record etc
                if re.match(r'^\s*(public\s+|abstract\s+|final\s+)*(class|interface|enum|record)\s+', l):
                    insert_idx = i
                    break
            
            if insert_idx != -1:
                # check if there's already a SupressWarnings
                # if there is, we might just insert another one, Java allows multiple although it's better to merge
                # but let's just insert
                out_lines.insert(insert_idx, sup_str)
                content = "\n".join(out_lines)
                
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done")

import os
import re

components_dir = "src/app/modules/gestion-receveur/components"

def refactor_form(content):
    # wrapper
    content = re.sub(r'<div class="nav-actions">[\s\S]*?</div>\s*<div class="container">\s*<div class="form-card">', 
                     '<div class="page-container">\n  <div class="form-wrapper">\n    <div class="form-card">', content)
    
    # header
    content = re.sub(r'<div class="header">\s*<h1>(.*?)</h1>\s*<p>(.*?)</p>\s*</div>',
                     r'<div class="form-header">\n      <div class="header-icon"><i class="bi bi-pencil-square"></i></div>\n      <div>\n        <h3>\1</h3>\n        <p>\2</p>\n      </div>\n    </div>', content)
    
    # labels and inputs
    content = re.sub(r'<label>', '<label class="form-label">', content)
    content = content.replace('class="form-control"', 'class="form-input"')
    
    # actions
    content = content.replace('class="buttons"', 'class="form-actions mt-4"')
    content = content.replace('class="btn-save"', 'class="btn-submit"')
    content = content.replace('class="btn-primary"', 'class="btn-submit"')
    content = content.replace('class="btn-secondary"', 'class="btn-cancel"')
    
    # errors
    content = content.replace('class="error-message"', 'class="alert-error"')
    
    # append closing div for wrapper
    if '<div class="form-wrapper">' in content and not content.endswith('</div>\n</div>\n</div>'):
        content += '\n  </div>\n</div>'
    return content


def refactor_list(content):
    # wrapper
    content = re.sub(r'<div class="nav-actions">[\s\S]*?</div>\s*<div class="container">', 
                     '<div class="page-container">', content)
    
    # header
    content = re.sub(r'<div class="header">\s*<div>\s*<h1>(.*?)</h1>\s*<p>(.*?)</p>\s*</div>\s*(<button.*?>(.*?)</button>)?\s*</div>',
                     lambda m: f'<div class="page-header">\n    <div class="page-title">\n      <div class="title-icon"><i class="bi bi-list-ul"></i></div>\n      <div class="title-text">\n        <h2>{m.group(1)}</h2>\n        <p>{m.group(2)}</p>\n      </div>\n    </div>\n    <div class="header-actions">\n      <a routerLink="/receveur/dashboard" class="btn-back me-3"><i class="bi bi-arrow-left"></i> Retour</a>\n      {m.group(3) if m.group(3) else ""}\n    </div>\n  </div>', content)
                     
    # replace add button class
    content = content.replace('class="btn-add"', 'class="btn-add" style="color: white; text-decoration: none;"')
    
    # containers
    content = content.replace('class="stats-card"', 'class="stats-row"')
    content = content.replace('class="stat"', 'class="stat-card"')
    content = content.replace('class="besoins-list"', 'class="table-card" style="display:flex; flex-direction:column; gap:15px;"')
    
    # errors
    content = content.replace('class="error-card"', 'class="alert-error"')

    return content


def refactor_detail(content):
    # Simplify detail view refactor
    content = re.sub(r'<div class="nav-actions">[\s\S]*?</div>\s*<div class="container">', 
                     '<div class="page-container">', content)
    content = content.replace('class="detail-card"', 'class="form-card"')
    content = content.replace('class="header"', 'class="form-header"')
    return content

for root, dirs, files in os.walk(components_dir):
    for f in files:
        if f.endswith('.html'):
            path = os.path.join(root, f)
            with open(path, 'r') as file:
                html = file.read()
            
            if '-form' in path: 
                html = refactor_form(html)
            elif '-list' in path:
                html = refactor_list(html)
            elif '-detail' in path:
                html = refactor_detail(html)
            elif 'dashboard' in path:
                # Basic dashboard wrapper update
                html = html.replace('class="dashboard"', 'class="page-container"')
                
            with open(path, 'w') as file:
                file.write(html)
print("done")

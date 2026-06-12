import sys

filepath = 'c:/Desktop/LoginApp/frontend/src/styles.css'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix typo
content = content.replace('-webkit-\tborder-right', 'border-right')
content = content.replace('\t-webkit-\tborder-right: 1px solid var(--border-color);', '\tborder-right: 1px solid var(--border-color);')

# Replace white background
content = content.replace('background: #ffffff;', 'background: var(--panel-bg);')
content = content.replace('color: #fff;', 'color: #ffffff;')

# Add dark theme
dark_theme = """
[data-theme="dark"] {
	--bg-color: #0f172a;
	--bg-gradient: none;
	--panel-bg: #1e293b;
	--border-color: #334155;
	--border-light: #1e293b;
	--text-main: #f8fafc;
	--text-muted: #94a3b8;
	--text-soft: #64748b;
	--shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
}

.theme-toggle-btn {
	background: transparent;
	border: 1px solid var(--border-color);
	color: var(--text-muted);
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px;
	border-radius: 50%;
	transition: all 0.2s ease;
}

.theme-toggle-btn:hover {
	background: var(--border-light);
	color: var(--text-main);
}
"""
if '[data-theme="dark"]' not in content:
    content = content + '\n' + dark_theme

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done updating styles.')

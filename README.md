# Tree-sitter AppArmor

[![CI](https://github.com/ne-bknn/tree-sitter-apparmor/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/ne-bknn/tree-sitter-apparmor/actions/workflows/ci.yml)

A Tree-sitter grammar dedicated to the [AppArmor](https://apparmor.net/) policy language.

## Getting Started

```bash
git clone https://github.com/ne-bknn/tree-sitter-apparmor
cd tree-sitter-apparmor
npm install
npm test
```

- Use the generated grammar with the Tree-sitter CLI (`tree-sitter parse`).
- Queries for highlighting, folding, locals, and indentation are available under `queries/`.

## Roadmap

- [ ] Ship editor plugins for **Zed**, **VS Code**, and **Neovim** powered by this grammar.
- [ ] Launch a **web-based playground** showcasing live parsing, highlighting, and sample policies.
- [ ] Curate a **collection of ast-grep rules** to lint and modernize AppArmor profiles automatically.
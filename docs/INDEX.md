# Documentation Index

Welcome to the German Lernen documentation! This index will help you find what you need.

## 📖 Getting Started

**New to the project?** Start here:
1. [README.md](../README.md) - Project overview, features, quick start
2. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Journey, key decisions, lessons learned

## 🏗️ Architecture & Design

**Understanding how it works:**
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design, components, data flow, animations
- [DATABASE.md](DATABASE.md) - Schema, queries, operations, migrations

## 🔧 Development

**Working on the code:**
- [TODO.md](../TODO.md) - Roadmap, features to build, bugs to fix
- [CHANGELOG.md](../CHANGELOG.md) - Version history, what changed when
- [scripts/README.md](../scripts/README.md) - How to rebuild the vocabulary database

## 📚 Reference

### Quick Links

| Topic | File | What's Inside |
|-------|------|---------------|
| **Setup** | [README.md](../README.md) | Installation, dependencies, running locally |
| **Features** | [README.md](../README.md) | Complete feature list with explanations |
| **Tech Stack** | [README.md](../README.md) + [ARCHITECTURE.md](ARCHITECTURE.md) | What we use and why |
| **Database** | [DATABASE.md](DATABASE.md) | Schema, queries, how data flows |
| **Components** | [ARCHITECTURE.md](ARCHITECTURE.md) | App.tsx, database.ts, theme system |
| **Animations** | [ARCHITECTURE.md](ARCHITECTURE.md) | How card swiping works |
| **Design System** | [README.md](../README.md) | Colors, typography, spacing |
| **Data Source** | [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Why Anki decks, data quality |
| **Roadmap** | [TODO.md](../TODO.md) | What's next, priorities |
| **History** | [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Development journey, challenges |

### By Role

**👨‍💻 Developer** (contributing code):
1. [README.md](../README.md) - Setup instructions
2. [ARCHITECTURE.md](ARCHITECTURE.md) - How the code is organized
3. [DATABASE.md](DATABASE.md) - How data works
4. [TODO.md](../TODO.md) - What needs to be built

**🎨 Designer** (UI/UX work):
1. [README.md](../README.md) - Design system (colors, typography)
2. [ARCHITECTURE.md](ARCHITECTURE.md) - Animation strategy
3. [TODO.md](../TODO.md) - Design tasks (icon, onboarding, etc.)

**📊 Product Manager** (planning features):
1. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - What we built, key decisions
2. [TODO.md](../TODO.md) - Roadmap, priorities
3. [CHANGELOG.md](../CHANGELOG.md) - Version history

**📝 Content Creator** (vocabulary data):
1. [DATABASE.md](DATABASE.md) - Schema, data requirements
2. [scripts/README.md](../scripts/README.md) - How to rebuild database
3. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Why Anki, data quality criteria

**🚀 DevOps** (deployment):
1. [README.md](../README.md) - Tech stack, dependencies
2. [TODO.md](../TODO.md) - Deployment tasks
3. (Future: DEPLOYMENT.md for build/release process)

## 🔍 Common Questions

### "How do I run the app?"
See [README.md](../README.md) → Setup section

### "How does the card swiping work?"
See [ARCHITECTURE.md](ARCHITECTURE.md) → Animation Strategy

### "Where does the vocabulary come from?"
See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) → Vocabulary Database

### "How do I add new words?"
See [scripts/README.md](../scripts/README.md) → Database Build Scripts

### "What's the database schema?"
See [DATABASE.md](DATABASE.md) → Schema section

### "How does undo work?"
See [ARCHITECTURE.md](ARCHITECTURE.md) → Undo Flow

### "Why SQLite instead of JSON?"
See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) → Key Decisions

### "What needs to be done before App Store?"
See [TODO.md](../TODO.md) → Priority 1 section

### "How do user edits persist across updates?"
See [DATABASE.md](DATABASE.md) → `user_edits` table

### "What's the learning algorithm?"
See [README.md](../README.md) → Learning Algorithm

## 📝 Documentation Standards

**When adding new docs:**
- Use Markdown
- Add to this index
- Keep it concise (link to code for details)
- Include examples where helpful
- Update CHANGELOG.md if relevant

**File naming:**
- ALL_CAPS.md for root-level docs (README, TODO, CHANGELOG)
- PascalCase.md for technical docs (Architecture, Database)
- lowercase.md for subdirectories (scripts/readme.md)

## 🤝 Contributing

Want to improve the docs? Check:
1. [TODO.md](../TODO.md) → Documentation section
2. Look for "TBD" or "TODO" in existing docs
3. Submit a PR with your improvements!

---

**Last Updated**: October 13, 2025  
**Version**: 0.1.0 (MVP)


# QuickTow - Agent Guide

This document provides guidelines for AI agents working on this codebase.

## Project Context

QuickTow is a tow truck booking system built with Node.js, Express.js, EJS, and MySQL. It serves the Pakistan market with English/Urdu bilingual support.

## Development Rules

### Code Style
- Use CommonJS (`require` / `module.exports`) — the project uses `"type": "commonjs"`
- Follow existing patterns in `app.js` for new routes
- Keep routes in `app.js` — do not split into separate route files unless asked
- Use `db.execute()` with parameterized queries (never concatenate user input into SQL)
- Validate all user input on the server side before database operations

### Database
- Connection pool is in `config/db.js`
- Schema is in `config/schema.sql`
- Tables: `drivers`, `bookings`, `status_history`, `admins`, `blogs`
- Always use parameterized queries: `db.execute('SELECT * FROM users WHERE id = ?', [id])`

### Frontend
- Templates are in `views/` using EJS
- Static files in `public/css/` and `public/js/`
- Translations in `locales/en.json` and `locales/ur.json`
- Use `t.property` for all user-facing text (never hardcode strings)
- Support RTL layout for Urdu language

### Security
- Never commit `.env` file
- Admin path is configurable via `ADMIN_PATH` env var
- Session-based authentication for drivers and admins
- Phone validation: must match `03XXXXXXXXX` format (Pakistani numbers)
- Input length limits enforced on server side

### File Structure
- `app.js` — All routes and middleware
- `config/db.js` — MySQL connection pool
- `config/schema.sql` — Database schema and seed data
- `views/` — EJS templates (10 files)
- `public/` — Static assets
- `locales/` — Translation JSON files

## Common Tasks

### Adding a New Route
1. Add route in `app.js` following existing patterns
2. Create EJS template in `views/`
3. Add translations in `locales/en.json` and `locales/ur.json`
4. Use `db.execute()` for any database operations

### Adding a New Database Table
1. Add `CREATE TABLE` statement in `config/schema.sql`
2. Add foreign keys where appropriate
3. Update this document

### Adding a New Page
1. Create `.ejs` file in `views/`
2. Add route in `app.js`
3. Add nav link in all page templates
4. Add translations for the new page

## Testing

- No test framework is currently configured
- To test manually: `npm start` and visit `http://localhost:3000`
- Test all three user roles: customer, driver, admin

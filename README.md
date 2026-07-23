# Nour AI Starter

Eine statische Creative-Studio-Webapp für GitHub Pages.

## Start
1. ZIP entpacken.
2. Alle Dateien in ein neues GitHub-Repository hochladen.
3. GitHub: **Settings → Pages → Build and deployment → GitHub Actions**.
4. Nach dem Workflow-Lauf ist die Seite online.

## Standard-Admin
- Benutzername: `admin`
- Passwort: `admin123`

Bitte nach dem ersten Start im Code ändern. Die Konten liegen in `localStorage` und gelten nur im jeweiligen Browser.

## Enthalten
- Nutzung als Gast
- Registrierung ohne E-Mail-Bestätigung
- Rollen: Benutzer, Mitarbeiter, Admin
- Admin kann Konten anlegen/löschen und Design ändern
- Sticker als PNG
- Bildkarten als PNG
- Video-Storyboard
- Mini-Spiel als HTML
- Website als HTML
- GitHub-Pages-Workflow

## Wichtige Grenzen
Diese GitHub-Pages-Version besitzt keinen sicheren Server. Deshalb sind Anmeldung und Projekte nur lokal im Browser gespeichert. Echte KI-Bild- und Videoerzeugung benötigt einen externen KI-Dienst und meist API-Kosten. Eine frei wählbare `.com`-Domain muss bei einem Domain-Anbieter registriert und bezahlt werden; GitHub Pages bietet kostenlos eine `github.io`-Adresse.

Für eine echte Mehrbenutzer-Version empfiehlt sich Supabase/Firebase plus ein sicherer Server oder Cloudflare Worker.
Nour AI

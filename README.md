# Nour AI Studio v4

Diese Version ergänzt die bereits funktionierende Vercel-Version um:

- freiwillige Anmeldung ohne E-Mail-Bestätigung
- Gastmodus
- Benutzer-, Mitarbeiter- und Adminrollen
- Admin kann lokale Konten erstellen, Rollen ändern und Konten löschen
- Admin kann Name, Untertitel, Logo-Buchstabe und Farbe ändern
- automatische Erkennung von Bild-, Video- und Website-Aufträgen
- Bildfehler `image/png` wurde auf `image/jpeg` korrigiert
- Chat behauptet nicht mehr, Nour AI sei nur textbasiert
- Bild-, Video- und Website-Editor bleiben enthalten

## Standard-Admin

- Benutzername: `admin`
- Passwort: `admin123`

Nach dem ersten Login das Passwort im Kontofenster ändern.

## Aktualisierung

1. ZIP entpacken.
2. GitHub → Repository `Nourai` → Add file → Upload files.
3. Den gesamten Inhalt dieser ZIP hochladen und vorhandene Dateien ersetzen.
4. Commit changes.
5. Vercel veröffentlicht automatisch neu. Der vorhandene `GEMINI_API_KEY` bleibt erhalten.

## Hinweis zu Konten

Damit die Einrichtung einfach bleibt, werden Konten und Rollen in dieser Version im Browser gespeichert. Sie funktionieren auf demselben Gerät und Browser. Für gemeinsame Konten auf mehreren Geräten wäre eine Datenbank wie Supabase nötig.

# Nour AI – echte KI-Version

Eine moderne Chat-Oberfläche mit serverseitiger Gemini-Anbindung.

## Funktionen

- echter KI-Chat mit `gemini-3.6-flash`
- echte Bildgenerierung und Bildbearbeitung mit `gemini-3.1-flash-image`
- echte 8-Sekunden-Videos mit Ton über `veo-3.1-generate-preview`
- komplette Websites aus einer Beschreibung
- visueller Website-Editor: Texte, Überschriften, Buttons, Bilder und Hintergrund ändern
- HTML-Download
- lokaler Chatverlauf und lokale Projekte
- responsive Handy- und Desktopansicht

## Schnellstart

Lies zuerst **START-HIER.txt**.

Vercel benötigt diese geheime Umgebungsvariable:

```text
GEMINI_API_KEY=dein_schluessel
```

Der Schlüssel gehört ausschließlich in Vercel und niemals in GitHub-Dateien.

## Hinweis

Diese einfache Version benötigt keine zusätzliche Datenbank. Deshalb werden Verlauf und Websites im Browser gespeichert. Sichere Konten, Rollen und ein echter Admin-Bereich würden zusätzlich eine Datenbank wie Supabase benötigen.

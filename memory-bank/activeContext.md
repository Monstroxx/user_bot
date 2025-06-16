# Active Context

## Current Focus
Erweitere die Discord Browser-Automatisierung um wiederholtes Nachrichten-Senden:
1. ✅ Konfigurationsdatei für Channel-ID
2. ✅ Hauptscript mit Puppeteer
3. ✅ Discord-Login-Erkennung
4. ✅ Automatische Channel-Navigation
5. ✅ Automatisches Senden einer konfigurierbaren Nachricht
6. 🔄 Intervall-basierte Nachrichtenwiederholung

## Recent Decisions
- Puppeteer als Browser-Automatisierung (stabil und gut dokumentiert)
- JSON-Konfiguration für einfache Bearbeitung
- Non-headless Modus für manuelle Login-Interaktion
- Timeout-basierte Login-Erkennung

## Next Steps
1. ✅ package.json und Dependencies einrichten
2. ✅ Konfigurationsdatei erstellen
3. ✅ Hauptscript implementieren
4. ✅ Discord-Navigation testen
5. 🔄 Automatisches Nachrichten-Senden implementieren

## Implementation Notes
- Discord verwendet dynamische CSS-Klassen, daher mehrere Selektoren als Fallback
- Login-Erkennung über URL-Änderung oder spezifische DOM-Elemente
- Channel-Navigation über direkte URL oder GUI-Navigation
- Nachrichten-Input über CSS-Selektoren und Tastatureingabe
- Warten auf Channel-Load vor Nachrichtensendung
- setInterval für wiederholte Nachrichten mit konfigurierbarem Intervall
- Graceful Shutdown mit Intervall-Cleanup

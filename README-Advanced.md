   npm install
   ```

2. **Konfiguration wählen:**
   - Für einfache Nutzung: Bearbeiten Sie `config.json`
   - Für erweiterte Features: Bearbeiten Sie `config-advanced.json`

3. **Channel-IDs eintragen:**
   - Gehen Sie zu Discord im Browser
   - Öffnen Sie gewünschten Channel
   - Kopieren Sie die Channel-ID aus der URL
   - Tragen Sie die ID in die Konfiguration ein

4. **Starten:**
   ```bash
   # Einfacher Modus
   npm run start-basic
   
   # Erweiterter Modus
   npm run start-advanced
   ```

## 🎮 Verwendung

### Einfacher Modus:
1. Bot startet → Browser öffnet sich
2. Manuell in Discord einloggen
3. Bot navigiert zu konfiguriertem Channel
4. Nachricht wird gesendet
5. Wiederholungen starten (falls aktiviert)

### Erweiterter Multi-Modus:
1. Bot startet → Browser öffnet sich  
2. Manuell in Discord einloggen
3. Bot arbeitet alle Configs nacheinander ab:
   - Navigiert zu Channel 1 → Sendet Nachricht → Startet Wiederholung
   - Navigiert zu Channel 2 → Sendet Nachricht → Startet Wiederholung
   - etc.
4. Alle konfigurierten Wiederholungen laufen parallel

## 🔧 Konsolen-Output

```
✅ Erweiterte Konfiguration geladen (config-advanced.json)
🚀 Starte Browser...
✅ Browser gestartet
🌐 Öffne Discord...
✅ Discord geladen
⏳ Warte auf manuellen Login...
✅ Login erkannt
🎯 Modus: Mehrere Channels
   Anzahl Configs: 2

📋 Verarbeite: Morgenbegrüßung
📍 Navigiere zu Channel: 1234567890
⏲️  Random Delay: 3.2s (Morgenbegrüßung)
📝 Sende Nachricht - Morgenbegrüßung
✅ Nachricht gesendet! - Morgenbegrüßung
🔄 Starte Wiederholung alle 10 Min - Morgenbegrüßung

📋 Verarbeite: Updates
📍 Navigiere zu Channel: 9876543210
⏲️  Random Delay: 7.8s (Updates)
📝 Sende Nachricht - Updates
✅ Nachricht gesendet! - Updates
🔄 Starte Wiederholung alle 30 Min - Updates

🎉 Bot erfolgreich gestartet!
   Browser bleibt offen für weitere Nutzung.
   📝 Aktive Wiederholungen: 2
     - Channel: 1234567890
     - Channel: 9876543210
```

## 🔄 Modus wechseln

In `config-advanced.json` den `mode` ändern:

```json
{
  "mode": "single",  // für einen Channel
  // oder
  "mode": "multi"    // für mehrere Channels
}
```

## ⚠️ Wichtige Hinweise

- **Minimum Intervall**: 1 Minute (60000ms)
- **Random Delays**: Helfen bei der Bot-Erkennung
- **Channel-Rechte**: Stellen Sie sicher, dass Sie Schreibrechte haben
- **Rate Limits**: Discord hat Limits - verwenden Sie angemessene Intervalle
- **Graceful Shutdown**: Verwenden Sie Ctrl+C zum sauberen Beenden

## 🚫 Fehlerbehebung

- **"Kein Config gefunden"**: Erstellen Sie config-advanced.json oder nutzen Sie den einfachen Modus
- **"Channel-ID nicht konfiguriert"**: Ersetzen Sie CHANNEL_ID_X mit echten Channel-IDs
- **"Random Delay ungültig"**: Min-Wert muss kleiner als Max-Wert sein
- **"Nachricht nicht gesendet"**: Prüfen Sie Channel-Rechte und Verfügbarkeit
- **"Intervall zu kurz"**: Minimum ist 60000ms (1 Minute)

## 🎯 Tipps für optimale Nutzung

1. **Realistische Intervalle**: Verwenden Sie 5+ Minuten zwischen Nachrichten
2. **Random Delays**: Aktivieren Sie diese für natürlicheres Verhalten  
3. **Begrenzte Wiederholungen**: Setzen Sie maxRepeats für automatisches Stoppen
4. **Aussagekräftige Namen**: Verwenden Sie `name`-Felder für bessere Übersicht
5. **Testen Sie zuerst**: Beginnen Sie mit kurzen Intervallen zum Testen

## 📁 Dateistruktur

```
user_bot/
├── index.js                 # Einfacher Bot (original)
├── index-advanced.js        # Erweiterter Bot (neu)
├── config.json             # Einfache Konfiguration
├── config-advanced.json    # Erweiterte Konfiguration
├── package.json            # Projekt-Konfiguration
└── README-Advanced.md      # Diese Anleitung
```

Beide Versionen können parallel verwendet werden!
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
## 🎛️ **Streamlit Web Interface (NEU!)**

**Benutzerfreundliche grafische Oberfläche zur Konfiguration:**

```bash
npm run config-editor
# oder
streamlit run config_editor.py
```

**Features:**
- 🎨 **Visual Editor** - Keine JSON-Bearbeitung nötig
- 🎮 **OwO Bot Presets** - Vorgefertigte Konfigurationen
- 📱 **Responsive Design** - Funktioniert auf Desktop und Mobile
- 💾 **Auto-Backup** - Automatische Sicherung vor Änderungen
- 📊 **Live Preview** - Echzeit JSON-Ansicht
- 📥 **Import/Export** - Konfigurationen teilen und sichern

## 🆕 Neueste Features (v2.0)

### 🎲 Random Message Selection
Definieren Sie mehrere Nachrichten pro Konfiguration und lassen Sie den Bot zufällig auswählen:

```json
{
  "name": "OwO Hunt Bot",
  "channelId": "IHRE_CHANNEL_ID",
  "message1": "OwO hunt",
  "message2": "owo hunt", 
  "message3": "Hunt time! OwO",
  "message4": "owo hunt pls",
  "randomMessage": true,
  "sendMessage": true,
  "repeatMessage": true,
  "repeatInterval": 20000,
  "randomDelay": true,
  "randomDelayMin": 0,
  "randomDelayMax": 5000
}
```

**Wie es funktioniert:**
- Fügen Sie `message1`, `message2`, `message3`, etc. hinzu
- Setzen Sie `"randomMessage": true`
- Bot wählt bei jedem Senden eine zufällige Nachricht
- Console zeigt an: `🎲 Zufällige Nachricht gewählt: message2 = "owo hunt"`

### 🛑 !exit Command
Stoppen Sie den Bot dynamisch durch Eingabe in Discord:

**So funktioniert es:**
1. Bot läuft und überwacht alle aktiven Channels
2. Schreiben Sie `!exit` in einen der überwachten Channels
3. Bot erkennt den Command sofort und beendet sich graceful
4. Console zeigt: `🛑 !exit Command erkannt - Bot wird beendet...`

**Vorteile:**
- Kein Wechsel zur Console nötig
- Sofortiges Stoppen aus Discord heraus
- Funktioniert in allen aktiven Channels
- Graceful Shutdown mit Cleanup

### 🛡️ Anti-Message-Merging
- **Zeichen-für-Zeichen Eingabe**: Verhindert dass Nachrichten zusammengefasst werden
- **Konfigurierbare Typing-Geschwindigkeit**: 20-100ms zwischen Zeichen
- **Feld-Clearing**: Leert Eingabefeld vor jeder Nachricht
- **Text-Verifikation**: Prüft ob Nachricht korrekt eingegeben wurde

### ⚡ Optimiert für Gaming Bots
Perfekt konfiguriert für OwO-Bot und ähnliche Discord Gaming Bots:

**Beispiel OwO Hunt Config:**
```json
{
  "mode": "multi",
  "multiConfigs": [
    {
      "name": "OwO Hunt",
      "channelId": "IHRE_CHANNEL_ID",
      "message1": "OwO hunt",
      "message2": "owo hunt",
      "message3": "owo h",
      "message4": "Hunt time!",
      "randomMessage": true,
      "repeatMessage": true,
      "repeatInterval": 20000,
      "randomDelay": true,
      "randomDelayMin": 0,
      "randomDelayMax": 3000
    },
    {
      "name": "OwO Battle", 
      "channelId": "IHRE_CHANNEL_ID",
      "message1": "OwO battle",
      "message2": "owo battle",
      "message3": "owo b",
      "randomMessage": true,
      "repeatMessage": true,
      "repeatInterval": 25000,
      "randomDelay": true,
      "randomDelayMin": 1000,
      "randomDelayMax": 5000
    }
  ]
}
```

## 🎮 Gaming Bot Features

### ✅ Anti-Detection Features
- **Random Message Selection**: Variiert Befehle automatisch
- **Random Delays**: Unregelmäßige Timing-Muster
- **Kurze Intervalle**: 3+ Sekunden möglich (statt 1 Minute)
- **Natürliche Variation**: Sieht menschlicher aus

### 📊 Console Output Beispiel
```
✅ Erweiterte Konfiguration geladen (config-advanced.json)
🎧 Aktiviere !exit Command Listener...
✅ !exit Command Listener aktiv
🎯 Modus: Mehrere Channels

📋 Verarbeite: OwO Hunt
🎲 Zufällige Nachricht gewählt: message2 = "owo hunt"
📝 Sende Nachricht - OwO Hunt
⏲️  Random Delay: 2.3s (OwO Hunt)
✅ Nachricht gesendet! - OwO Hunt
🔄 Starte Wiederholung alle 20 Sec - OwO Hunt

🎉 Bot erfolgreich gestartet!
   💬 Schreibe "!exit" in einen überwachten Channel zum Beenden
   📝 Aktive Wiederholungen: 2
```

### 🛡️ Sicherheitshinweise
- **Discord ToS**: Verwenden Sie Bots verantwortungsvoll
- **Rate Limits**: Überschreiten Sie nicht Discord's Limits
- **Angemessene Intervalle**: Mindestens 10-15 Sekunden zwischen Commands
- **Überwachung**: Bleiben Sie in der Nähe für manuelle Kontrolle


# Discord Browser Automation

Eine Node.js-basierte Browser-Automatisierung für Discord, die automatisch zu einem konfigurierbaren Channel navigiert.

## Installation

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Konfiguration anpassen:**
   Öffnen Sie `config.json` und ersetzen Sie `"IHRE_CHANNEL_ID_HIER"` mit der gewünschten Discord Channel-ID.

## Verwendung

1. **Bot starten:**
   ```bash
   npm start
   ```
   oder
   ```bash
   node index.js
   ```

2. **Ablauf:**
   - Browser öffnet sich automatisch
   - Discord Login-Seite wird geladen
   - **Manueller Login erforderlich**: Loggen Sie sich normal in Discord ein
   - Nach erfolgreichem Login navigiert der Bot automatisch zum konfigurierten Channel
   - **Automatische Nachricht**: Falls aktiviert, wird die konfigurierte Nachricht gesendet
   - **Wiederholte Nachrichten**: Falls aktiviert, werden Nachrichten in konfigurierbaren Intervallen wiederholt

3. **Bot beenden:**
   - `Ctrl+C` in der Konsole
   - Browser schließt sich automatisch

## Konfiguration

Die Datei `config.json` enthält folgende Einstellungen:

```json
{
  "channelId": "IHRE_CHANNEL_ID_HIER",
  "message": "Hallo! Ich bin automatisch hier angekommen! 🤖",
  "timeout": 60000,
  "headless": false,
  "discordUrl": "https://discord.com/login",
  "sendMessage": true,
  "messageDelay": 2000,
  "repeatMessage": false,
  "repeatInterval": 300000,
  "maxRepeats": 0
}
```

### Konfigurationsoptionen:

**Grundeinstellungen:**
- `channelId`: Discord Channel-ID (erforderlich)
- `message`: Nachricht die automatisch gesendet wird
- `timeout`: Maximale Wartezeit für Login in Millisekunden
- `headless`: Browser im Hintergrund ausführen (false für manuellen Login)
- `discordUrl`: Discord Login-URL

**Nachrichteneinstellungen:**
- `sendMessage`: Automatisches Senden aktivieren/deaktivieren (true/false)
- `messageDelay`: Wartezeit vor dem ersten Senden in Millisekunden

**Wiederholungseinstellungen:**
- `repeatMessage`: Nachrichtenwiederholung aktivieren (true/false)
- `repeatInterval`: Intervall zwischen Nachrichten in Millisekunden (min. 60000 = 1 Minute)
- `maxRepeats`: Maximale Anzahl Wiederholungen (0 = unbegrenzt)

## Nachricht konfigurieren

### Einmalige Nachricht:
1. Öffnen Sie `config.json`
2. Setzen Sie `"sendMessage": true` um das automatische Senden zu aktivieren
3. Ändern Sie `"message"` zu Ihrem gewünschten Text
4. Optional: Passen Sie `"messageDelay"` an (Wartezeit vor dem Senden)

### Wiederholte Nachrichten:
1. Setzen Sie `"repeatMessage": true`
2. Konfigurieren Sie `"repeatInterval"` in Millisekunden:
   - 60000 = 1 Minute
   - 300000 = 5 Minuten  
   - 600000 = 10 Minuten
   - 1800000 = 30 Minuten
3. Optional: Setzen Sie `"maxRepeats"` (0 = unbegrenzt)

### Beispielkonfigurationen:

**Alle 5 Minuten, unbegrenzt:**
```json
{
  "repeatMessage": true,
  "repeatInterval": 300000,
  "maxRepeats": 0
}
```

**Alle 10 Minuten, maximal 6 mal:**
```json
{
  "repeatMessage": true,
  "repeatInterval": 600000,
  "maxRepeats": 6
}
```

Um das automatische Senden zu deaktivieren, setzen Sie `"sendMessage": false`.

## Channel-ID finden

1. Öffnen Sie Discord im Browser
2. Navigieren Sie zum gewünschten Channel
3. Die Channel-ID ist in der URL: `https://discord.com/channels/SERVER_ID/CHANNEL_ID`
4. Kopieren Sie die CHANNEL_ID in die config.json

## Fehlerbehebung

- **"Channel-ID konfigurieren"**: Stellen Sie sicher, dass die Channel-ID in config.json korrekt eingetragen ist
- **Timeout-Fehler**: Erhöhen Sie den timeout-Wert in config.json
- **Navigation fehlgeschlagen**: Überprüfen Sie, ob die Channel-ID korrekt ist und Sie Zugriff auf den Channel haben
- **Nachricht nicht gesendet**: Stellen Sie sicher, dass Sie Schreibrechte im Channel haben
- **Nachrichteneingabefeld nicht gefunden**: Der Bot versucht mehrere Fallback-Methoden automatisch
- **Intervall zu kurz**: Minimum-Intervall ist 1 Minute (60000ms) - wird automatisch angepasst
- **Wiederholungen stoppen nicht**: Verwenden Sie Ctrl+C für graceful shutdown
- **Browser schließt sich**: Wiederholungen werden automatisch gestoppt wenn Browser nicht mehr verfügbar

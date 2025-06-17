# Debug Guide: !exit Command

Das !exit Command funktioniert noch nicht? Hier ist die Lösung!

## 🐛 Problem diagnostizieren

### Schritt 1: Debug-Tool verwenden
```bash
npm run debug-exit
# oder
node debug-exit.js
```

Dieses Tool:
- Öffnet Discord mit DevTools
- Zeigt alle gefundenen Nachrichten an
- Testet verschiedene CSS-Selektoren
- Hilft beim Identifizieren der richtigen Discord-Struktur

### Schritt 2: Discord-Nachrichten testen
1. Debug-Tool starten
2. In Discord einloggen
3. Zu einem Channel navigieren
4. `!exit` schreiben
5. In der Console ENTER drücken
6. Schauen ob das Tool `!exit` findet

## 🔧 Mögliche Lösungen

### Lösung 1: Discord-Selektoren aktualisiert
Discord ändert häufig seine CSS-Klassen. Der erweiterte Bot prüft bereits diese Selektoren:
- `[class*="messageContent"]`
- `[class*="markup"]`
- `div[class*="content"] span`
- `[role="document"] span`

### Lösung 2: Häufigere Checks
Der Bot prüft jetzt alle 2 Sekunden statt nur bei Intervallen:
```javascript
// Exit-Check alle 2 Sekunden
this.exitCheckInterval = setInterval(async () => {
    await this.checkExitCommand();
}, 2000);
```

### Lösung 3: Erweiterte Suche
Der Bot durchsucht jetzt auch alle Text-Nodes:
```javascript
// Tree Walker für alle Text-Inhalte
const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
);
```

## 🚀 Aktualisierte Funktionen

### Verbesserter !exit Check in index-advanced.js:
1. **Mehrere CSS-Selektoren** für verschiedene Discord-Layouts
2. **Text-Node Suche** als Fallback
3. **Häufigere Checks** (alle 2 Sekunden)
4. **Debug-Ausgaben** in der Console
5. **Robuste Fehlerbehandlung**

### So testen Sie:
1. **Bot starten:**
   ```bash
   npm run start-advanced
   ```

2. **!exit schreiben** in Discord

3. **Console beobachten:**
   ```
   ✅ !exit Command Listener aktiv (Check alle 2 Sekunden)
   🛑 !exit Command erkannt - Bot wird beendet...
   ```

## 🔍 Debugging-Tipps

### Console Output verstehen:
```
🎧 Aktiviere !exit Command Listener...
✅ !exit Command Listener aktiv (Check alle 2 Sekunden)
```
= Listener läuft

```
!exit Command gefunden in: [class*="messageContent"]
Nachrichtentext: "!exit"
🛑 !exit Command erkannt - Bot wird beendet...
```
= Erfolgreich erkannt!

### Wenn es immer noch nicht funktioniert:
1. **Debug-Tool nutzen** (`npm run debug-exit`)
2. **DevTools öffnen** (F12 in Discord)
3. **Nachrichten-Struktur untersuchen**
4. **CSS-Selektoren anpassen** falls nötig

### Manuelle Discord-Inspektion:
1. F12 in Discord drücken
2. Element-Inspektor verwenden
3. Eine Nachricht auswählen
4. CSS-Klassen notieren
5. Selektoren im Code aktualisieren falls nötig

## ⚡ Schnelle Lösung

Falls nichts funktioniert, verwenden Sie temporär Ctrl+C in der Console:
1. Bot läuft
2. Ctrl+C drücken
3. Bot beendet sich graceful

## 🎯 Neue Features in der aktualisierten Version:

- ✅ Erweiterte Nachrichten-Erkennung
- ✅ Häufigere Exit-Checks (2s Intervall)
- ✅ Debug-Tool für Problemdiagnose
- ✅ Robuste Fallback-Mechanismen
- ✅ Detaillierte Console-Logs

Das !exit Command sollte jetzt deutlich zuverlässiger funktionieren!

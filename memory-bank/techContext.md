# Technical Context

## Technology Stack
- **Runtime**: Node.js
- **Browser Automation**: Puppeteer
- **Configuration**: JSON files
- **Package Manager**: npm

## Dependencies
- puppeteer: Browser-Automatisierung
- fs/promises: Dateisystem-Operationen für Config

## Development Setup
```bash
npm init -y
npm install puppeteer
```

## Browser Requirements
- Chromium (über Puppeteer installiert)
- Headless-Modus optional konfigurierbar

## Configuration Structure
```json
{
  "channelId": "CHANNEL_ID_HERE",
  "timeout": 60000,
  "headless": false
}
```

## Discord Integration
- Verwendung der Web-Version von Discord
- CSS-Selektoren für Navigation
- Wartung auf DOM-Elemente

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class DebugDiscordBot {
    constructor() {
        this.browser = null;
        this.page = null;
        this.config = null;
    }

    async loadConfig() {
        try {
            let configPath = path.join(__dirname, 'config-advanced.json');
            let configData;
            
            try {
                configData = await fs.readFile(configPath, 'utf8');
                console.log('✅ Debug-Konfiguration geladen');
            } catch (error) {
                configPath = path.join(__dirname, 'config.json');
                configData = await fs.readFile(configPath, 'utf8');
                console.log('✅ Fallback-Konfiguration geladen');
            }
            
            this.config = JSON.parse(configData);
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der Konfiguration:', error.message);
            process.exit(1);
        }
    }

    async startBrowser() {
        try {
            console.log('🚀 Starte Debug-Browser...');
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: null,
                args: ['--start-maximized'],
                devtools: true // Öffne DevTools für Debugging
            });
            
            this.page = await this.browser.newPage();
            console.log('✅ Debug-Browser gestartet');
        } catch (error) {
            console.error('❌ Fehler beim Starten des Browsers:', error.message);
            throw error;
        }
    }

    async openDiscord() {
        try {
            console.log('🌐 Öffne Discord...');
            const discordUrl = this.config.globalSettings?.discordUrl || 'https://discord.com/login';
            await this.page.goto(discordUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            console.log('✅ Discord geladen');
        } catch (error) {
            console.error('❌ Fehler beim Öffnen von Discord:', error.message);
            throw error;
        }
    }

    async waitForLogin() {
        try {
            console.log('⏳ Warte auf manuellen Login...');
            
            await this.page.waitForFunction(
                () => {
                    const url = window.location.href;
                    return url.includes('/channels/') || url.includes('/app');
                },
                { timeout: 120000 }
            );
            
            console.log('✅ Login erkannt');
            await this.page.waitForTimeout(3000);
            
        } catch (error) {
            console.error('❌ Fehler beim Login:', error.message);
            throw error;
        }
    }

    async debugMessages() {
        console.log('\n🔍 Debug: Suche nach Nachrichten...');
        
        const messages = await this.page.evaluate(() => {
            const selectors = [
                '[class*="messageContent"]',
                '[class*="markup"]', 
                '.messageContent',
                'div[class*="content"] span',
                '[role="document"] span'
            ];
            
            const foundMessages = [];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((element, index) => {
                    const text = element.textContent?.trim();
                    if (text && text.length > 0) {
                        foundMessages.push({
                            selector: selector,
                            index: index,
                            text: text,
                            isExit: text === '!exit'
                        });
                    }
                });
            });
            
            return foundMessages;
        });
        
        console.log(`📄 Gefunden: ${messages.length} Nachrichten`);
        
        messages.forEach((msg, i) => {
            if (i < 10) { // Zeige nur erste 10
                console.log(`${i + 1}. ${msg.selector}: "${msg.text}" ${msg.isExit ? '🛑 MATCH!' : ''}`);
            }
        });
        
        if (messages.length > 10) {
            console.log(`... und ${messages.length - 10} weitere`);
        }
        
        const exitMessages = messages.filter(m => m.isExit);
        if (exitMessages.length > 0) {
            console.log(`🎯 !exit Commands gefunden: ${exitMessages.length}`);
            return true;
        }
        
        return false;
    }

    async run() {
        try {
            await this.loadConfig();
            await this.startBrowser();
            await this.openDiscord();
            await this.waitForLogin();
            
            console.log('\n🎉 Debug-Bot gestartet!');
            console.log('📝 Schreibe "!exit" in Discord und drücke dann ENTER in der Console zum Testen');
            
            // Interactive Debug Loop
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            const checkLoop = () => {
                rl.question('\nDrücke ENTER zum Prüfen von !exit oder "q" zum Beenden: ', async (answer) => {
                    if (answer.toLowerCase() === 'q') {
                        console.log('👋 Debug beendet');
                        await this.browser.close();
                        rl.close();
                        process.exit(0);
                    } else {
                        const found = await this.debugMessages();
                        if (found) {
                            console.log('✅ !exit wurde gefunden! Der normale Bot sollte sich beenden.');
                        } else {
                            console.log('❌ !exit wurde NICHT gefunden. Prüfe Discord-Nachrichten.');
                        }
                        checkLoop();
                    }
                });
            };
            
            checkLoop();
            
        } catch (error) {
            console.error('💥 Debug-Fehler:', error.message);
            process.exit(1);
        }
    }
}

// Debug Bot starten
console.log('🐛 Discord Debug Bot - !exit Command Tester');
console.log('Dieser Bot hilft beim Debuggen der !exit Funktionalität\n');

const debugBot = new DebugDiscordBot();
debugBot.run();

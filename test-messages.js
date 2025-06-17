const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class MessageTestBot {
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
                console.log('✅ Test-Konfiguration geladen');
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
            console.log('🚀 Starte Test-Browser...');
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: null,
                args: ['--start-maximized']
            });
            
            this.page = await this.browser.newPage();
            console.log('✅ Test-Browser gestartet');
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

    async navigateToTestChannel() {
        try {
            const channelId = this.config.multiConfigs?.[0]?.channelId || 
                            this.config.singleConfig?.channelId || 
                            'KEINE_CHANNEL_ID';
            
            console.log(`📍 Navigiere zu Test-Channel: ${channelId}`);
            
            const channelUrl = `https://discord.com/channels/@me/${channelId}`;
            await this.page.goto(channelUrl, { 
                waitUntil: 'networkidle2',
                timeout: 15000 
            });
            
            console.log('✅ Test-Channel geöffnet');
            
        } catch (error) {
            console.error('❌ Fehler beim Navigieren zum Channel:', error.message);
            throw error;
        }
    }

    async testMessage(message) {
        try {
            console.log(`\n🧪 Teste Nachricht: "${message}"`);
            
            // Finde Nachrichteneingabefeld
            const messageSelectors = [
                '[data-slate-editor="true"]',
                'div[role="textbox"]',
                '[contenteditable="true"][data-slate-editor="true"]',
                '.slateTextArea-1Mkdgw',
                'div[aria-label*="Nachricht"]',
                'div[aria-label*="Message"]'
            ];
            
            let messageBox = null;
            for (const selector of messageSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 3000 });
                    messageBox = await this.page.$(selector);
                    if (messageBox) break;
                } catch (error) {
                    // Weiter suchen
                }
            }
            
            if (!messageBox) {
                throw new Error('Nachrichteneingabefeld nicht gefunden');
            }
            
            // Sende Test-Nachricht
            await messageBox.click();
            await this.page.waitForTimeout(500);
            
            // Lösche vorhandenen Inhalt
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            await this.page.waitForTimeout(100);
            
            // Tippe Nachricht
            await messageBox.type(message);
            await this.page.waitForTimeout(300);
            
            console.log(`📝 Nachricht eingegeben: "${message}"`);
            
            // NICHT senden, nur testen
            console.log('⏸️  Nachricht NICHT gesendet (nur Test)');
            
            // Prüfe Eingabefeld-Inhalt
            const inputText = await messageBox.evaluate(el => {
                return el.textContent || el.innerText || el.value || '';
            });
            
            console.log(`🔍 Text im Feld: "${inputText.trim()}"`);
            
            if (inputText.trim() === message.trim()) {
                console.log('✅ Text korrekt eingegeben!');
                return true;
            } else {
                console.log('❌ Text unterscheidet sich!');
                console.log(`   Erwartet: "${message}"`);
                console.log(`   Gefunden: "${inputText.trim()}"`);
                return false;
            }
            
        } catch (error) {
            console.error('❌ Fehler beim Testen der Nachricht:', error.message);
            return false;
        }
    }

    async run() {
        try {
            await this.loadConfig();
            await this.startBrowser();
            await this.openDiscord();
            await this.waitForLogin();
            await this.navigateToTestChannel();
            
            console.log('\n🎉 Test-Bot gestartet!');
            console.log('📝 Teste verschiedene Nachrichten...\n');
            
            // Test verschiedene Nachrichten
            const testMessages = [
                'OwO hunt',
                'owo hunt',
                'OwO battle',
                'owo battle',
                'test message'
            ];
            
            let successCount = 0;
            
            for (const message of testMessages) {
                const success = await this.testMessage(message);
                if (success) successCount++;
                await this.page.waitForTimeout(1000);
            }
            
            console.log(`\n📊 Test Ergebnis: ${successCount}/${testMessages.length} erfolgreich`);
            
            if (successCount === testMessages.length) {
                console.log('🎯 Alle Tests bestanden! Nachrichten funktionieren korrekt.');
            } else {
                console.log('⚠️  Einige Tests fehlgeschlagen. Nachrichten könnten Probleme haben.');
            }
            
            console.log('\n🔧 Browser bleibt offen für weitere Tests...');
            console.log('Drücke Ctrl+C zum Beenden');
            
            // Event-Listener für graceful shutdown
            process.on('SIGINT', async () => {
                console.log('\n👋 Test beendet');
                await this.browser.close();
                process.exit(0);
            });
            
        } catch (error) {
            console.error('💥 Test-Fehler:', error.message);
            process.exit(1);
        }
    }
}

// Test Bot starten
console.log('🧪 Discord Message Test Bot');
console.log('Testet ob Nachrichten korrekt eingegeben werden (ohne sie zu senden)\n');

const testBot = new MessageTestBot();
testBot.run();

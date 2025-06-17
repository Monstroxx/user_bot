const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class DiscordBot {
    constructor() {
        this.browser = null;
        this.page = null;
        this.config = null;
        this.messageInterval = null;
        this.messageCount = 0;
    }

    async loadConfig() {
        try {
            const configPath = path.join(__dirname, 'config.json');
            const configData = await fs.readFile(configPath, 'utf8');
            this.config = JSON.parse(configData);
            
            if (!this.config.channelId || this.config.channelId === 'IHRE_CHANNEL_ID_HIER') {
                throw new Error('Bitte Channel-ID in config.json konfigurieren');
            }
            
            // Validiere Nachrichtenkonfiguration
            if (this.config.sendMessage && !this.config.message) {
                console.warn('⚠️  sendMessage ist aktiviert, aber keine Nachricht konfiguriert');
                this.config.sendMessage = false;
            }
            
            // Validiere Intervall-Konfiguration
            if (this.config.repeatMessage && this.config.repeatInterval < 3000) {
                console.warn('⚠️  Intervall zu kurz (minimum 3 sec), setze auf 3 sec');
                this.config.repeatInterval = 3000;
            }
            
            console.log('✅ Konfiguration geladen');
        } catch (error) {
            console.error('❌ Fehler beim Laden der Konfiguration:', error.message);
            process.exit(1);
        }
    }

    async startBrowser() {
        try {
            console.log('🚀 Starte Browser...');
            this.browser = await puppeteer.launch({
                headless: this.config.headless,
                defaultViewport: null,
                args: ['--start-maximized']
            });
            
            this.page = await this.browser.newPage();
            console.log('✅ Browser gestartet');
        } catch (error) {
            console.error('❌ Fehler beim Starten des Browsers:', error.message);
            throw error;
        }
    }

    async openDiscord() {
        try {
            console.log('🌐 Öffne Discord...');
            await this.page.goto(this.config.discordUrl, { 
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
            console.log('   Bitte loggen Sie sich in Discord ein.');
            
            // Warte auf URL-Änderung die erfolgreichen Login signalisiert
            await this.page.waitForFunction(
                () => {
                    const url = window.location.href;
                    return url.includes('/channels/') || url.includes('/app');
                },
                { timeout: this.config.timeout }
            );
            
            console.log('✅ Login erkannt');
            
            // Kurz warten bis Discord vollständig geladen ist
            await this.page.waitForTimeout(3000);
            
        } catch (error) {
            if (error.name === 'TimeoutError') {
                console.error('❌ Timeout: Login nicht innerhalb der Zeit erkannt');
            } else {
                console.error('❌ Fehler beim Warten auf Login:', error.message);
            }
            throw error;
        }
    }

    async navigateToChannel() {
        try {
            console.log(`📍 Navigiere zu Channel: ${this.config.channelId}`);
            
            // Direkte Navigation über URL
            const channelUrl = `https://discord.com/channels/@me/${this.config.channelId}`;
            await this.page.goto(channelUrl, { 
                waitUntil: 'networkidle2',
                timeout: 15000 
            });
            
            console.log('✅ Channel erfolgreich geöffnet');
            
        } catch (error) {
            console.error('❌ Fehler beim Navigieren zum Channel:', error.message);
            
            // Fallback: Versuche über GUI zu navigieren
            try {
                console.log('🔄 Versuche GUI-Navigation...');
                await this.navigateViaGUI();
            } catch (guiError) {
                console.error('❌ GUI-Navigation fehlgeschlagen:', guiError.message);
                throw error;
            }
        }
    }

    async navigateViaGUI() {
        // Fallback-Methode für GUI-Navigation
        // Diese wird implementiert, falls direkte URL-Navigation fehlschlägt
        
        // Suche nach Channel in der Seitenleiste
        const channelSelectors = [
            `[data-list-item-id="channels___${this.config.channelId}"]`,
            `[href*="${this.config.channelId}"]`,
            `a[href="/channels/@me/${this.config.channelId}"]`
        ];
        
        for (const selector of channelSelectors) {
            try {
                await this.page.waitForSelector(selector, { timeout: 5000 });
                await this.page.click(selector);
                console.log('✅ Channel über GUI gefunden und geklickt');
                return;
            } catch (error) {
                console.log(`⚠️  Selector ${selector} nicht gefunden, versuche nächsten...`);
            }
        }
        
        throw new Error('Channel nicht in der GUI gefunden');
    }

    async sendMessage(isRepeat = false) {
        if (!this.config.sendMessage || !this.config.message) {
            console.log('📝 Nachrichtensendung deaktiviert oder keine Nachricht konfiguriert');
            return false;
        }

        try {
            if (isRepeat) {
                console.log(`📝 Sende wiederholte Nachricht (${this.messageCount + 1}/${this.config.maxRepeats || '∞'})...`);
            } else {
                console.log('📝 Sende Nachricht...');
            }
            
            // Warte auf das Laden des Channels (nur beim ersten Mal)
            if (!isRepeat) {
                await this.page.waitForTimeout(this.config.messageDelay || 2000);
            }
            
            // Verschiedene Selektoren für das Nachrichteneingabefeld
            const messageSelectors = [
                '[data-slate-editor="true"]',
                'div[role="textbox"]',
                '[contenteditable="true"][data-slate-editor="true"]',
                '.slateTextArea-1Mkdgw',
                'div[aria-label*="Nachricht"]',
                'div[aria-label*="Message"]'
            ];
            
            let messageBox = null;
            
            // Suche nach dem Nachrichteneingabefeld
            for (const selector of messageSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 5000 });
                    messageBox = await this.page.$(selector);
                    if (messageBox) {
                        if (!isRepeat) console.log(`✅ Nachrichtenfeld gefunden: ${selector}`);
                        break;
                    }
                } catch (error) {
                    if (!isRepeat) console.log(`⚠️  Selector ${selector} nicht gefunden, versuche nächsten...`);
                }
            }
            
            if (!messageBox) {
                throw new Error('Nachrichteneingabefeld nicht gefunden');
            }
            
            // Fokussiere das Eingabefeld und sende die Nachricht
            await messageBox.click();
            await this.page.waitForTimeout(500);
            
            // Text eingeben
            await messageBox.type(this.config.message);
            await this.page.waitForTimeout(500);
            
            // Enter drücken zum Senden
            await this.page.keyboard.press('Enter');
            
            this.messageCount++;
            
            if (isRepeat) {
                console.log(`✅ Wiederholte Nachricht gesendet! (${this.messageCount}/${this.config.maxRepeats || '∞'})`);
            } else {
                console.log('✅ Nachricht erfolgreich gesendet!');
                console.log(`   Text: "${this.config.message}"`);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Fehler beim Senden der Nachricht:', error.message);
            
            // Fallback: Versuche über Zwischenablage
            try {
                console.log('🔄 Versuche Fallback über Zwischenablage...');
                await this.sendMessageFallback();
                return true;
            } catch (fallbackError) {
                console.error('❌ Fallback-Methode fehlgeschlagen:', fallbackError.message);
                return false;
            }
        }
    }

    async sendMessageFallback() {
        // Fallback-Methode über Tastenkombinationen
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('KeyA');
        await this.page.keyboard.up('Control');
        
        await this.page.keyboard.type(this.config.message);
        await this.page.waitForTimeout(300);
        await this.page.keyboard.press('Enter');
        
        console.log('✅ Nachricht über Fallback-Methode gesendet');
    }

    startMessageInterval() {
        if (!this.config.repeatMessage) {
            console.log('🔄 Nachrichtenwiederholung deaktiviert');
            return;
        }

        const intervalMinutes = Math.round(this.config.repeatInterval / 6000);
        console.log(`🔄 Starte Nachrichtenwiederholung alle ${intervalMinutes} Seconds`);
        
        if (this.config.maxRepeats > 0) {
            console.log(`   Maximale Wiederholungen: ${this.config.maxRepeats}`);
        } else {
            console.log('   Unbegrenzte Wiederholungen (Ctrl+C zum Stoppen)');
        }

        this.messageInterval = setInterval(async () => {
            // Prüfe Maximal-Anzahl
            if (this.config.maxRepeats > 0 && this.messageCount >= this.config.maxRepeats) {
                console.log('🏁 Maximale Anzahl Wiederholungen erreicht');
                this.stopMessageInterval();
                return;
            }

            // Prüfe ob Browser noch läuft
            if (!this.browser || !this.page) {
                console.log('❌ Browser nicht mehr verfügbar, stoppe Wiederholungen');
                this.stopMessageInterval();
                return;
            }

            // Sende wiederholte Nachricht
            const success = await this.sendMessage(true);
            if (!success) {
                console.log('❌ Nachrichtensendung fehlgeschlagen, versuche weiter...');
            }
        }, this.config.repeatInterval);
    }

    stopMessageInterval() {
        if (this.messageInterval) {
            clearInterval(this.messageInterval);
            this.messageInterval = null;
            console.log('⏹️  Nachrichtenwiederholung gestoppt');
        }
    }

    async cleanup() {
        this.stopMessageInterval();
        if (this.browser) {
            console.log('🧹 Schließe Browser...');
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.loadConfig();
            await this.startBrowser();
            await this.openDiscord();
            await this.waitForLogin();
            await this.navigateToChannel();
            
            // Erste Nachricht senden
            const firstMessageSent = await this.sendMessage();
            
            // Intervall starten falls konfiguriert
            if (firstMessageSent && this.config.repeatMessage) {
                this.startMessageInterval();
            }
            
            console.log('🎉 Bot erfolgreich gestartet!');
            console.log('   Browser bleibt offen für weitere Nutzung.');
            
            if (this.config.repeatMessage) {
                const intervalMinutes = Math.round(this.config.repeatInterval / 6000);
                console.log(`   📝 Nachrichten werden alle ${intervalMinutes} sec wiederholt`);
            }
            
            // Event-Listener für graceful shutdown
            process.on('SIGINT', async () => {
                console.log('\n👋 Bot wird beendet...');
                await this.cleanup();
                process.exit(0);
            });
            
        } catch (error) {
            console.error('💥 Unerwarteter Fehler:', error.message);
            await this.cleanup();
            process.exit(1);
        }
    }
}

// Bot starten
const bot = new DiscordBot();
bot.run();

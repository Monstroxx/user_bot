const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class AdvancedDiscordBot {
    constructor() {
        this.browser = null;
        this.page = null;
        this.config = null;
        this.activeIntervals = new Map(); // channelId -> intervalId
        this.messageCounts = new Map(); // channelId -> count
        this.currentChannelId = null;
    }

    async loadConfig() {
        try {
            // Versuche erweiterte Konfiguration zu laden
            let configPath = path.join(__dirname, 'config-advanced.json');
            let configData;
            
            try {
                configData = await fs.readFile(configPath, 'utf8');
                console.log('✅ Erweiterte Konfiguration geladen (config-advanced.json)');
            } catch (error) {
                // Fallback zur einfachen Konfiguration
                configPath = path.join(__dirname, 'config.json');
                configData = await fs.readFile(configPath, 'utf8');
                console.log('✅ Einfache Konfiguration geladen (config.json)');
            }
            
            this.config = JSON.parse(configData);
            await this.validateConfig();
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der Konfiguration:', error.message);
            process.exit(1);
        }
    }

    async validateConfig() {
        // Konvertiere alte Konfiguration zu neuer Struktur
        if (!this.config.mode) {
            console.log('🔄 Konvertiere alte Konfiguration...');
            const oldConfig = { ...this.config };
            this.config = {
                mode: 'single',
                globalSettings: {
                    timeout: oldConfig.timeout || 60000,
                    headless: oldConfig.headless || false,
                    discordUrl: oldConfig.discordUrl || 'https://discord.com/login'
                },
                singleConfig: oldConfig
            };
        }

        // Validiere Konfiguration
        if (this.config.mode === 'single') {
            if (!this.config.singleConfig.channelId || 
                this.config.singleConfig.channelId === 'IHRE_CHANNEL_ID_HIER') {
                throw new Error('Bitte Channel-ID in singleConfig konfigurieren');
            }
            this.validateSingleConfig(this.config.singleConfig);
        } else if (this.config.mode === 'multi') {
            if (!this.config.multiConfigs || this.config.multiConfigs.length === 0) {
                throw new Error('Keine Multi-Configs konfiguriert');
            }
            this.config.multiConfigs.forEach((config, index) => {
                if (!config.channelId || config.channelId.startsWith('CHANNEL_ID_')) {
                    throw new Error(`Multi-Config ${index + 1}: Channel-ID nicht konfiguriert`);
                }
                this.validateSingleConfig(config);
            });
        } else {
            throw new Error('Unbekannter Modus. Verwende "single" oder "multi"');
        }
    }

    validateSingleConfig(config) {
        // Validiere Nachrichtenkonfiguration
        if (config.sendMessage && !config.message) {
            console.warn(`⚠️  sendMessage aktiviert, aber keine Nachricht konfiguriert (${config.name || 'Config'})`);
            config.sendMessage = false;
        }
        
        // Validiere Intervall
        if (config.repeatMessage && config.repeatInterval < 3000) {
            console.warn(`⚠️  Intervall zu kurz, setze auf 1 Minute (${config.name || 'Config'})`);
            config.repeatInterval = 3000;
        }
        
        // Validiere Random Delay
        if (config.randomDelay) {
            if (config.randomDelayMin >= config.randomDelayMax) {
                console.warn(`⚠️  Ungültiger Random Delay Bereich, deaktiviere Random Delay (${config.name || 'Config'})`);
                config.randomDelay = false;
            }
        }
    }

    async startBrowser() {
        try {
            console.log('🚀 Starte Browser...');
            this.browser = await puppeteer.launch({
                headless: this.config.globalSettings.headless,
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
            await this.page.goto(this.config.globalSettings.discordUrl, { 
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
            
            await this.page.waitForFunction(
                () => {
                    const url = window.location.href;
                    return url.includes('/channels/') || url.includes('/app');
                },
                { timeout: this.config.globalSettings.timeout }
            );
            
            console.log('✅ Login erkannt');
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

    async navigateToChannel(channelId) {
        try {
            console.log(`📍 Navigiere zu Channel: ${channelId}`);
            
            const channelUrl = `https://discord.com/channels/@me/${channelId}`;
            await this.page.goto(channelUrl, { 
                waitUntil: 'networkidle2',
                timeout: 15000 
            });
            
            this.currentChannelId = channelId;
            console.log('✅ Channel erfolgreich geöffnet');
            
        } catch (error) {
            console.error('❌ Fehler beim Navigieren zum Channel:', error.message);
            throw error;
        }
    }

    getRandomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    async applyRandomDelay(config, configName = '') {
        if (!config.randomDelay) return;
        
        const delay = this.getRandomDelay(config.randomDelayMin, config.randomDelayMax);
        const seconds = (delay / 1000).toFixed(1);
        console.log(`⏲️  Random Delay: ${seconds}s ${configName ? `(${configName})` : ''}`);
        await this.page.waitForTimeout(delay);
    }

    async sendMessage(config, isRepeat = false, configName = '') {
        if (!config.sendMessage || !config.message) {
            console.log(`📝 Nachrichtensendung deaktiviert ${configName ? `(${configName})` : ''}`);
            return false;
        }

        try {
            const channelId = config.channelId;
            const count = this.messageCounts.get(channelId) || 0;
            
            if (isRepeat) {
                console.log(`📝 Sende wiederholte Nachricht (${count + 1}/${config.maxRepeats || '∞'}) ${configName ? `- ${configName}` : ''}`);
            } else {
                console.log(`📝 Sende Nachricht ${configName ? `- ${configName}` : ''}`);
            }
            
            // Stelle sicher, dass wir im richtigen Channel sind
            if (this.currentChannelId !== channelId) {
                await this.navigateToChannel(channelId);
            }
            
            // Random Delay anwenden
            await this.applyRandomDelay(config, configName);
            
            // Warte auf Channel-Load (nur beim ersten Mal)
            if (!isRepeat) {
                await this.page.waitForTimeout(config.messageDelay || 2000);
            }

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
                    await this.page.waitForSelector(selector, { timeout: 5000 });
                    messageBox = await this.page.$(selector);
                    if (messageBox) break;
                } catch (error) {
                    // Weiter suchen
                }
            }
            
            if (!messageBox) {
                throw new Error('Nachrichteneingabefeld nicht gefunden');
            }
            
            // Nachricht senden
            await messageBox.click();
            await this.page.waitForTimeout(500);
            await messageBox.type(config.message);
            await this.page.waitForTimeout(500);
            await this.page.keyboard.press('Enter');
            
            // Counter aktualisieren
            this.messageCounts.set(channelId, count + 1);
            
            if (isRepeat) {
                console.log(`✅ Wiederholte Nachricht gesendet! (${count + 1}/${config.maxRepeats || '∞'}) ${configName ? `- ${configName}` : ''}`);
            } else {
                console.log(`✅ Nachricht gesendet! ${configName ? `- ${configName}` : ''}`);
            }
            
            return true;
            
        } catch (error) {
            console.error(`❌ Fehler beim Senden der Nachricht ${configName ? `(${configName})` : ''}:`, error.message);
            return false;
        }
    }

    async startMessageInterval(config, configName = '') {
        if (!config.repeatMessage) {
            console.log(`🔄 Nachrichtenwiederholung deaktiviert ${configName ? `(${configName})` : ''}`);
            return;
        }

        const channelId = config.channelId;
        const intervalMinutes = Math.round(config.repeatInterval / 6000);
        
        console.log(`🔄 Starte Wiederholung alle ${intervalMinutes} Sec ${configName ? `- ${configName}` : ''}`);
        
        if (config.maxRepeats > 0) {
            console.log(`   Max. Wiederholungen: ${config.maxRepeats}`);
        }

        const intervalId = setInterval(async () => {
            const currentCount = this.messageCounts.get(channelId) || 0;
            
            // Prüfe Maximal-Anzahl
            if (config.maxRepeats > 0 && currentCount >= config.maxRepeats) {
                console.log(`🏁 Max. Wiederholungen erreicht ${configName ? `(${configName})` : ''}`);
                this.stopMessageInterval(channelId);
                return;
            }

            // Prüfe Browser-Verfügbarkeit
            if (!this.browser || !this.page) {
                console.log(`❌ Browser nicht verfügbar ${configName ? `(${configName})` : ''}`);
                this.stopMessageInterval(channelId);
                return;
            }

            // Sende wiederholte Nachricht
            await this.sendMessage(config, true, configName);
        }, config.repeatInterval);

        this.activeIntervals.set(channelId, intervalId);
    }

    stopMessageInterval(channelId) {
        const intervalId = this.activeIntervals.get(channelId);
        if (intervalId) {
            clearInterval(intervalId);
            this.activeIntervals.delete(channelId);
            console.log(`⏹️  Wiederholung gestoppt für Channel: ${channelId}`);
        }
    }

    stopAllIntervals() {
        for (const [channelId, intervalId] of this.activeIntervals) {
            clearInterval(intervalId);
            console.log(`⏹️  Wiederholung gestoppt: ${channelId}`);
        }
        this.activeIntervals.clear();
    }

    async cleanup() {
        this.stopAllIntervals();
        if (this.browser) {
            console.log('🧹 Schließe Browser...');
            await this.browser.close();
        }
    }

    async runSingleMode() {
        console.log('🎯 Modus: Einzelner Channel');
        const config = this.config.singleConfig;
        
        await this.navigateToChannel(config.channelId);
        
        // Erste Nachricht senden
        const success = await this.sendMessage(config);
        
        // Intervall starten
        if (success && config.repeatMessage) {
            await this.startMessageInterval(config);
        }
    }

    async runMultiMode() {
        console.log('🎯 Modus: Mehrere Channels');
        console.log(`   Anzahl Configs: ${this.config.multiConfigs.length}`);
        
        for (let i = 0; i < this.config.multiConfigs.length; i++) {
            const config = this.config.multiConfigs[i];
            const configName = config.name || `Config ${i + 1}`;
            
            console.log(`\n📋 Verarbeite: ${configName}`);
            
            try {
                await this.navigateToChannel(config.channelId);
                
                // Erste Nachricht senden
                const success = await this.sendMessage(config, false, configName);
                
                // Intervall starten
                if (success && config.repeatMessage) {
                    await this.startMessageInterval(config, configName);
                }
                
                // Kurze Pause zwischen Configs
                if (i < this.config.multiConfigs.length - 1) {
                    await this.page.waitForTimeout(2000);
                }
                
            } catch (error) {
                console.error(`❌ Fehler bei ${configName}:`, error.message);
                console.log('🔄 Weiter mit nächster Config...');
            }
        }
    }

    async run() {
        try {
            await this.loadConfig();
            await this.startBrowser();
            await this.openDiscord();
            await this.waitForLogin();
            
            // Führe entsprechenden Modus aus
            if (this.config.mode === 'single') {
                await this.runSingleMode();
            } else if (this.config.mode === 'multi') {
                await this.runMultiMode();
            }
            
            console.log('\n🎉 Bot erfolgreich gestartet!');
            console.log('   Browser bleibt offen für weitere Nutzung.');
            
            // Zeige aktive Intervalle
            if (this.activeIntervals.size > 0) {
                console.log(`   📝 Aktive Wiederholungen: ${this.activeIntervals.size}`);
                for (const [channelId] of this.activeIntervals) {
                    console.log(`     - Channel: ${channelId}`);
                }
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
const bot = new AdvancedDiscordBot();
bot.run();

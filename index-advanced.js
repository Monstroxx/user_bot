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
        this.exitCommandActive = false;
        this.exitCheckInterval = null;
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
        const hasRandomMessages = this.hasRandomMessages(config);
        const hasSingleMessage = config.message;
        
        if (config.sendMessage && !hasRandomMessages && !hasSingleMessage) {
            console.warn(`⚠️  sendMessage aktiviert, aber keine Nachricht konfiguriert (${config.name || 'Config'})`);
            config.sendMessage = false;
        }
        
        // Validiere Intervall
        if (config.repeatMessage && config.repeatInterval < 3000) {
            console.warn(`⚠️  Intervall zu kurz, setze auf 3 Sekunden (${config.name || 'Config'})`);
            config.repeatInterval = 3000;
        }
        
        // Validiere Random Delay
        if (config.randomDelay) {
            if (config.randomDelayMin >= config.randomDelayMax) {
                console.warn(`⚠️  Ungültiger Random Delay Bereich, deaktiviere Random Delay (${config.name || 'Config'})`);
                config.randomDelay = false;
            }
        }
        
        // Validiere Random Messages
        if (config.randomMessage && !hasRandomMessages) {
            console.warn(`⚠️  randomMessage aktiviert, aber keine message1, message2, etc. gefunden (${config.name || 'Config'})`);
            config.randomMessage = false;
        }
    }

    hasRandomMessages(config) {
        return Object.keys(config).some(key => key.match(/^message\d+$/));
    }

    getRandomMessage(config) {
        if (!config.randomMessage) {
            return config.message || '';
        }
        
        // Sammle alle messageX Felder
        const messageKeys = Object.keys(config).filter(key => key.match(/^message\d+$/));
        
        if (messageKeys.length === 0) {
            return config.message || '';
        }
        
        // Wähle zufällige Nachricht
        const randomKey = messageKeys[Math.floor(Math.random() * messageKeys.length)];
        const selectedMessage = config[randomKey];
        
        console.log(`🎲 Zufällige Nachricht gewählt: ${randomKey} = "${selectedMessage}"`);
        return selectedMessage;
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

    async setupExitCommandListener() {
        try {
            console.log('🎧 Aktiviere !exit Command Listener...');
            
            // Setze initial flag
            await this.page.evaluate(() => {
                window.botExitRequested = false;
            });
            
            // Starte häufigeres Exit-Check Intervall (alle 2 Sekunden)
            this.exitCheckInterval = setInterval(async () => {
                await this.checkExitCommand();
            }, 2000);
            
            console.log('✅ !exit Command Listener aktiv (Check alle 2 Sekunden)');
            
        } catch (error) {
            console.warn('⚠️  Konnte !exit Listener nicht einrichten:', error.message);
        }
    }

    async checkExitCommand() {
        try {
            // Prüfe alle sichtbaren Nachrichten im aktuellen Channel
            const exitFound = await this.page.evaluate(() => {
                // Erweiterte Suche nach Discord-Nachrichten
                const messageSelectors = [
                    '[class*="messageContent"]',
                    '[class*="markup"]',
                    '.messageContent',
                    '[data-testid="message-content"]',
                    'div[class*="content"] span',
                    '.content span',
                    '[role="document"] span'
                ];
                
                let found = false;
                
                for (const selector of messageSelectors) {
                    try {
                        const messages = document.querySelectorAll(selector);
                        for (const message of messages) {
                            const text = message.textContent?.trim();
                            if (text === '!exit') {
                                console.log(`!exit Command gefunden in: ${selector}`);
                                console.log(`Nachrichtentext: "${text}"`);
                                found = true;
                                break;
                            }
                        }
                        if (found) break;
                    } catch (e) {
                        // Weiter suchen bei Fehlern
                    }
                }
                
                // Zusätzlich: Suche in allen Text-Nodes
                if (!found) {
                    const walker = document.createTreeWalker(
                        document.body,
                        NodeFilter.SHOW_TEXT,
                        null,
                        false
                    );
                    
                    let node;
                    while (node = walker.nextNode()) {
                        if (node.textContent?.trim() === '!exit') {
                            console.log('!exit Command in Text-Node gefunden!');
                            found = true;
                            break;
                        }
                    }
                }
                
                return found;
            });
            
            if (exitFound) {
                console.log('🛑 !exit Command erkannt - Bot wird beendet...');
                await this.cleanup();
                process.exit(0);
            }
        } catch (error) {
            // Ignoriere Fehler beim Exit-Check
            console.log('⚠️  Fehler beim Exit-Check:', error.message);
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
        const hasRandomMessages = this.hasRandomMessages(config);
        const hasSingleMessage = config.message;
        
        if (!config.sendMessage || (!hasRandomMessages && !hasSingleMessage)) {
            console.log(`📝 Nachrichtensendung deaktiviert ${configName ? `(${configName})` : ''}`);
            return false;
        }

        try {
            // Check !exit command vor dem Senden
            await this.checkExitCommand();
            
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
            
            // Wähle Nachricht (random oder single)
            const messageToSend = this.getRandomMessage(config);

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
            await messageBox.type(messageToSend);
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
            // Check !exit command zuerst
            await this.checkExitCommand();
            
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
        
        // Stoppe auch Exit-Check Intervall
        if (this.exitCheckInterval) {
            clearInterval(this.exitCheckInterval);
            this.exitCheckInterval = null;
        }
        
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
            
            // Aktiviere !exit Command Listener
            await this.setupExitCommandListener();
            
            // Führe entsprechenden Modus aus
            if (this.config.mode === 'single') {
                await this.runSingleMode();
            } else if (this.config.mode === 'multi') {
                await this.runMultiMode();
            }
            
            console.log('\n🎉 Bot erfolgreich gestartet!');
            console.log('   Browser bleibt offen für weitere Nutzung.');
            console.log('   💬 Schreibe "!exit" in einen überwachten Channel zum Beenden');
            
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

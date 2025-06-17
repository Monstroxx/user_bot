import streamlit as st
import json
import os
from datetime import datetime

# Seitenkonfiguration
st.set_page_config(
    page_title="Discord Bot Config Editor",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS für besseres Styling
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #7289da 0%, #5865f2 100%);
        padding: 1rem;
        border-radius: 10px;
        margin-bottom: 2rem;
        color: white;
        text-align: center;
    }
    .config-section {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 10px;
        margin: 1rem 0;
        border-left: 4px solid #5865f2;
    }
    .danger-zone {
        background: #fee;
        padding: 1rem;
        border-radius: 10px;
        border-left: 4px solid #dc3545;
        margin: 1rem 0;
    }
    .success-zone {
        background: #d4edda;
        padding: 1rem;
        border-radius: 10px;
        border-left: 4px solid #28a745;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

class ConfigManager:
    def __init__(self):
        self.config_path = "config-advanced.json"
        self.backup_path = "config-backup.json"
    
    def load_config(self):
        """Lade die aktuelle Konfiguration"""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                return self.get_default_config()
        except Exception as e:
            st.error(f"Fehler beim Laden der Konfiguration: {e}")
            return self.get_default_config()
    
    def save_config(self, config):
        """Speichere die Konfiguration"""
        try:
            # Backup erstellen
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    backup_data = f.read()
                with open(self.backup_path, 'w', encoding='utf-8') as f:
                    f.write(backup_data)
            
            # Neue Konfiguration speichern
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            st.error(f"Fehler beim Speichern: {e}")
            return False
    
    def get_default_config(self):
        """Standard-Konfiguration"""
        return {
            "mode": "multi",
            "globalSettings": {
                "timeout": 60000,
                "headless": False,
                "discordUrl": "https://discord.com/login",
                "typingSpeed": 50,
                "preventMessageMerging": False,
                "clearFieldBeforeTyping": False
            },
            "singleConfig": {
                "channelId": "",
                "message1": "OwO hunt",
                "randomMessage": True,
                "sendMessage": True,
                "messageDelay": 5000,
                "repeatMessage": True,
                "repeatInterval": 20000,
                "maxRepeats": 0,
                "randomDelay": True,
                "randomDelayMin": 0,
                "randomDelayMax": 10000,
                "typingSpeed": 50,
                "preventMessageMerging": False,
                "clearFieldBeforeTyping": False
            },
            "multiConfigs": []
        }

def render_header():
    """Hauptheader rendern"""
    st.markdown("""
    <div class="main-header">
        <h1>🤖 Discord Bot Configuration Editor</h1>
        <p>Benutzerfreundliche Oberfläche zur Konfiguration des OwO-Bots</p>
    </div>
    """, unsafe_allow_html=True)

def render_global_settings(config):
    """Globale Einstellungen rendern"""
    st.markdown('<div class="config-section">', unsafe_allow_html=True)
    st.subheader("🌐 Globale Einstellungen")
    
    col1, col2 = st.columns(2)
    
    with col1:
        config["globalSettings"]["timeout"] = st.number_input(
            "Login Timeout (ms)",
            min_value=10000,
            max_value=300000,
            value=config["globalSettings"].get("timeout", 60000),
            step=5000,
            help="Maximale Wartezeit für Discord Login"
        )
        
        config["globalSettings"]["headless"] = st.checkbox(
            "Headless Modus",
            value=config["globalSettings"].get("headless", False),
            help="Browser im Hintergrund ausführen (nicht empfohlen für ersten Start)"
        )
        
        config["globalSettings"]["discordUrl"] = st.text_input(
            "Discord URL",
            value=config["globalSettings"].get("discordUrl", "https://discord.com/login"),
            help="URL für Discord Login"
        )
    
    with col2:
        config["globalSettings"]["typingSpeed"] = st.slider(
            "Standard Typing Speed (ms)",
            min_value=10,
            max_value=200,
            value=config["globalSettings"].get("typingSpeed", 50),
            help="Millisekunden zwischen Zeichen beim Tippen"
        )
        
        config["globalSettings"]["preventMessageMerging"] = st.checkbox(
            "Anti-Message-Merging",
            value=config["globalSettings"].get("preventMessageMerging", False),
            help="⚠️ Experimentell: Verhindert zusammengefasste Nachrichten"
        )
        
        config["globalSettings"]["clearFieldBeforeTyping"] = st.checkbox(
            "Feld vor Eingabe leeren",
            value=config["globalSettings"].get("clearFieldBeforeTyping", False),
            help="Eingabefeld vor jeder Nachricht leeren"
        )
    
    st.markdown('</div>', unsafe_allow_html=True)

def render_mode_selector(config):
    """Modus-Auswahl rendern"""
    st.markdown('<div class="config-section">', unsafe_allow_html=True)
    st.subheader("🎯 Bot Modus")
    
    mode_options = {
        "single": "Einzelner Channel (Einfach)",
        "multi": "Mehrere Channels (Erweitert)"
    }
    
    selected_mode = st.radio(
        "Wähle Bot-Modus:",
        options=list(mode_options.keys()),
        format_func=lambda x: mode_options[x],
        index=0 if config.get("mode", "multi") == "single" else 1,
        help="Single: Ein Channel, Multi: Mehrere Channels gleichzeitig"
    )
    
    config["mode"] = selected_mode
    st.markdown('</div>', unsafe_allow_html=True)
    
    return selected_mode

def render_message_inputs(prefix, config_item, key_prefix):
    """Mehrere Nachrichten-Eingaben rendern"""
    st.write("📝 **Nachrichten-Varianten:**")
    
    # Bestehende Nachrichten anzeigen
    message_keys = [k for k in config_item.keys() if k.startswith('message') and k[7:].isdigit()]
    message_keys.sort(key=lambda x: int(x[7:]) if x[7:].isdigit() else 0)
    
    if not message_keys:
        message_keys = ['message1']
    
    # Aktuelle Nachrichten bearbeiten
    for i, msg_key in enumerate(message_keys):
        col1, col2 = st.columns([4, 1])
        with col1:
            config_item[msg_key] = st.text_input(
                f"Nachricht {i+1}",
                value=config_item.get(msg_key, ""),
                key=f"{key_prefix}_{msg_key}",
                help=f"Nachricht Variante {i+1}"
            )
        with col2:
            if len(message_keys) > 1:
                if st.button("🗑️", key=f"{key_prefix}_del_{msg_key}", help="Nachricht löschen"):
                    del config_item[msg_key]
                    st.rerun()
    
    # Neue Nachricht hinzufügen
    if st.button(f"➕ Neue Nachricht hinzufügen", key=f"{key_prefix}_add"):
        next_num = max([int(k[7:]) for k in message_keys if k[7:].isdigit()] + [0]) + 1
        config_item[f"message{next_num}"] = ""
        st.rerun()
    
    # Random Message Toggle
    config_item["randomMessage"] = st.checkbox(
        "🎲 Zufällige Nachricht auswählen",
        value=config_item.get("randomMessage", True),
        key=f"{key_prefix}_random",
        help="Bot wählt zufällig eine der Nachrichten aus"
    )

def render_timing_settings(config_item, key_prefix):
    """Timing-Einstellungen rendern"""
    st.write("⏱️ **Timing-Einstellungen:**")
    
    col1, col2 = st.columns(2)
    
    with col1:
        config_item["messageDelay"] = st.number_input(
            "Erste Verzögerung (ms)",
            min_value=0,
            max_value=30000,
            value=config_item.get("messageDelay", 5000),
            step=500,
            key=f"{key_prefix}_delay",
            help="Wartezeit vor der ersten Nachricht"
        )
        
        config_item["repeatInterval"] = st.number_input(
            "Wiederholungsintervall (ms)",
            min_value=3000,
            max_value=3600000,
            value=config_item.get("repeatInterval", 20000),
            step=1000,
            key=f"{key_prefix}_interval",
            help="Zeit zwischen wiederholten Nachrichten"
        )
    
    with col2:
        config_item["maxRepeats"] = st.number_input(
            "Max. Wiederholungen",
            min_value=0,
            max_value=1000,
            value=config_item.get("maxRepeats", 0),
            key=f"{key_prefix}_max",
            help="0 = unbegrenzt"
        )
        
        config_item["typingSpeed"] = st.slider(
            "Typing Speed (ms)",
            min_value=10,
            max_value=200,
            value=config_item.get("typingSpeed", 50),
            key=f"{key_prefix}_typing",
            help="Geschwindigkeit der Texteingabe"
        )

def render_random_delay_settings(config_item, key_prefix):
    """Random Delay Einstellungen rendern"""
    st.write("🎲 **Random Delays:**")
    
    config_item["randomDelay"] = st.checkbox(
        "Random Delays aktivieren",
        value=config_item.get("randomDelay", True),
        key=f"{key_prefix}_random_delay",
        help="Zufällige Verzögerungen für natürlicheres Verhalten"
    )
    
    if config_item["randomDelay"]:
        col1, col2 = st.columns(2)
        with col1:
            config_item["randomDelayMin"] = st.number_input(
                "Min. Delay (ms)",
                min_value=0,
                max_value=60000,
                value=config_item.get("randomDelayMin", 0),
                step=500,
                key=f"{key_prefix}_rand_min"
            )
        with col2:
            config_item["randomDelayMax"] = st.number_input(
                "Max. Delay (ms)",
                min_value=0,
                max_value=60000,
                value=config_item.get("randomDelayMax", 10000),
                step=500,
                key=f"{key_prefix}_rand_max"
            )

def render_single_config(config):
    """Single Config rendern"""
    st.markdown('<div class="config-section">', unsafe_allow_html=True)
    st.subheader("🎯 Einzelner Channel Konfiguration")
    
    single_config = config.get("singleConfig", {})
    
    # Channel ID
    single_config["channelId"] = st.text_input(
        "Discord Channel ID",
        value=single_config.get("channelId", ""),
        help="Die Channel-ID aus Discord (aus der URL kopieren)"
    )
    
    # Nachrichten
    render_message_inputs("Single", single_config, "single")
    
    # Aktivierung
    col1, col2 = st.columns(2)
    with col1:
        single_config["sendMessage"] = st.checkbox(
            "✅ Nachrichten senden aktivieren",
            value=single_config.get("sendMessage", True),
            key="single_send"
        )
    with col2:
        single_config["repeatMessage"] = st.checkbox(
            "🔄 Wiederholung aktivieren",
            value=single_config.get("repeatMessage", True),
            key="single_repeat"
        )
    
    # Timing
    render_timing_settings(single_config, "single")
    
    # Random Delays
    render_random_delay_settings(single_config, "single")
    
    config["singleConfig"] = single_config
    st.markdown('</div>', unsafe_allow_html=True)

def render_multi_config(config):
    """Multi Config rendern"""
    st.markdown('<div class="config-section">', unsafe_allow_html=True)
    st.subheader("🚀 Multi-Channel Konfigurationen")
    
    multi_configs = config.get("multiConfigs", [])
    
    # Bestehende Configs anzeigen
    for i, config_item in enumerate(multi_configs):
        with st.expander(f"📋 {config_item.get('name', f'Config {i+1}')} - Channel: {config_item.get('channelId', 'Nicht gesetzt')}", expanded=False):
            col1, col2 = st.columns([3, 1])
            
            with col1:
                config_item["name"] = st.text_input(
                    "Config Name",
                    value=config_item.get("name", f"Config {i+1}"),
                    key=f"multi_name_{i}"
                )
            
            with col2:
                if st.button("🗑️ Löschen", key=f"multi_delete_{i}", type="secondary"):
                    multi_configs.pop(i)
                    st.rerun()
            
            # Channel ID
            config_item["channelId"] = st.text_input(
                "Discord Channel ID",
                value=config_item.get("channelId", ""),
                key=f"multi_channel_{i}",
                help="Die Channel-ID aus Discord"
            )
            
            # Nachrichten
            render_message_inputs(f"Multi {i}", config_item, f"multi_{i}")
            
            # Aktivierung
            col1, col2 = st.columns(2)
            with col1:
                config_item["sendMessage"] = st.checkbox(
                    "✅ Nachrichten senden",
                    value=config_item.get("sendMessage", True),
                    key=f"multi_send_{i}"
                )
            with col2:
                config_item["repeatMessage"] = st.checkbox(
                    "🔄 Wiederholung",
                    value=config_item.get("repeatMessage", True),
                    key=f"multi_repeat_{i}"
                )
            
            # Timing
            render_timing_settings(config_item, f"multi_{i}")
            
            # Random Delays
            render_random_delay_settings(config_item, f"multi_{i}")
    
    # Neue Config hinzufügen
    if st.button("➕ Neue Multi-Config hinzufügen", type="primary"):
        new_config = {
            "name": f"Config {len(multi_configs) + 1}",
            "channelId": "",
            "message1": "OwO hunt",
            "randomMessage": True,
            "sendMessage": True,
            "messageDelay": 5000,
            "repeatMessage": True,
            "repeatInterval": 20000,
            "maxRepeats": 0,
            "randomDelay": True,
            "randomDelayMin": 0,
            "randomDelayMax": 10000,
            "typingSpeed": 50,
            "preventMessageMerging": False,
            "clearFieldBeforeTyping": False
        }
        multi_configs.append(new_config)
        st.rerun()
    
    config["multiConfigs"] = multi_configs
    st.markdown('</div>', unsafe_allow_html=True)

def render_presets():
    """Vorgefertigte Konfigurationen"""
    st.markdown('<div class="config-section">', unsafe_allow_html=True)
    st.subheader("🎮 OwO Bot Presets")
    
    presets = {
        "OwO Hunt Basic": {
            "name": "OwO Hunt",
            "channelId": "",
            "message1": "OwO hunt",
            "message2": "owo hunt",
            "message3": "OwO h",
            "message4": "owo h",
            "randomMessage": True,
            "sendMessage": True,
            "messageDelay": 3000,
            "repeatMessage": True,
            "repeatInterval": 20000,
            "maxRepeats": 0,
            "randomDelay": True,
            "randomDelayMin": 1000,
            "randomDelayMax": 5000,
            "typingSpeed": 50
        },
        "OwO Battle": {
            "name": "OwO Battle",
            "channelId": "",
            "message1": "OwO battle",
            "message2": "owo battle",
            "message3": "OwO b",
            "message4": "owo b",
            "randomMessage": True,
            "sendMessage": True,
            "messageDelay": 3000,
            "repeatMessage": True,
            "repeatInterval": 25000,
            "maxRepeats": 0,
            "randomDelay": True,
            "randomDelayMin": 2000,
            "randomDelayMax": 8000,
            "typingSpeed": 50
        },
        "OwO Complete Set": [
            {
                "name": "Hunt",
                "message1": "OwO hunt", "message2": "owo hunt",
                "repeatInterval": 20000, "randomDelayMax": 5000
            },
            {
                "name": "Battle", 
                "message1": "OwO battle", "message2": "owo battle",
                "repeatInterval": 25000, "randomDelayMax": 8000
            },
            {
                "name": "Inventory",
                "message1": "OwO inv", "message2": "owo inventory",
                "repeatInterval": 300000, "randomDelayMax": 15000
            }
        ]
    }
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("🏹 Hunt Preset laden", type="secondary"):
            st.session_state['preset_to_load'] = presets["OwO Hunt Basic"]
    
    with col2:
        if st.button("⚔️ Battle Preset laden", type="secondary"):
            st.session_state['preset_to_load'] = presets["OwO Battle"]
    
    with col3:
        if st.button("🎯 Complete Set laden", type="secondary"):
            st.session_state['preset_complete'] = presets["OwO Complete Set"]
    
    st.markdown('</div>', unsafe_allow_html=True)

def main():
    """Hauptfunktion"""
    render_header()
    
    # Config Manager initialisieren
    config_manager = ConfigManager()
    
    # Session State für Config
    if 'config' not in st.session_state:
        st.session_state.config = config_manager.load_config()
    
    # Sidebar
    with st.sidebar:
        st.header("🛠️ Aktionen")
        
        if st.button("🔄 Konfiguration neu laden", type="secondary"):
            st.session_state.config = config_manager.load_config()
            st.success("Konfiguration neu geladen!")
        
        if st.button("💾 Konfiguration speichern", type="primary"):
            if config_manager.save_config(st.session_state.config):
                st.success("Konfiguration gespeichert!")
                st.balloons()
            else:
                st.error("Fehler beim Speichern!")
        
        st.markdown("---")
        
        # Bot starten
        st.subheader("🚀 Bot starten")
        if st.button("▶️ Advanced Bot starten"):
            st.code("npm run start-advanced", language="bash")
            st.info("Führe diesen Befehl im Terminal aus")
        
        if st.button("🧪 Nachrichten testen"):
            st.code("npm run test-messages", language="bash")
            st.info("Teste Nachrichten ohne sie zu senden")
        
        st.markdown("---")
        
        # Quick Info
        st.subheader("📊 Quick Info")
        config = st.session_state.config
        
        st.metric("Modus", config.get("mode", "multi"))
        
        if config.get("mode") == "multi":
            st.metric("Multi-Configs", len(config.get("multiConfigs", [])))
        
        # Timing Info
        if config.get("multiConfigs"):
            intervals = [c.get("repeatInterval", 0) for c in config["multiConfigs"]]
            if intervals:
                avg_interval = sum(intervals) / len(intervals) / 1000
                st.metric("Ø Intervall", f"{avg_interval:.1f}s")
    
    # Hauptbereich
    config = st.session_state.config
    
    # Preset Handling
    if 'preset_to_load' in st.session_state:
        preset = st.session_state['preset_to_load']
        if config.get("mode") == "multi":
            config["multiConfigs"].append(preset)
        else:
            config["singleConfig"].update(preset)
        del st.session_state['preset_to_load']
        st.success("Preset geladen!")
        st.rerun()
    
    if 'preset_complete' in st.session_state:
        config["multiConfigs"].extend(st.session_state['preset_complete'])
        del st.session_state['preset_complete']
        st.success("Complete Set geladen!")
        st.rerun()
    
    # Tabs
    tab1, tab2, tab3, tab4 = st.tabs(["🌐 Global", "🎯 Konfiguration", "🎮 Presets", "📋 JSON View"])
    
    with tab1:
        render_global_settings(config)
        selected_mode = render_mode_selector(config)
    
    with tab2:
        if config.get("mode") == "single":
            render_single_config(config)
        else:
            render_multi_config(config)
    
    with tab3:
        render_presets()
    
    with tab4:
        st.subheader("📋 Aktuelle Konfiguration (JSON)")
        st.json(config)
        
        st.subheader("📥 JSON Import/Export")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.download_button(
                label="📥 Konfiguration herunterladen",
                data=json.dumps(config, indent=2),
                file_name=f"discord-bot-config-{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                mime="application/json"
            )
        
        with col2:
            uploaded_file = st.file_uploader("📤 Konfiguration hochladen", type="json")
            if uploaded_file is not None:
                try:
                    imported_config = json.load(uploaded_file)
                    st.session_state.config = imported_config
                    st.success("Konfiguration importiert!")
                    st.rerun()
                except Exception as e:
                    st.error(f"Fehler beim Importieren: {e}")

if __name__ == "__main__":
    main()

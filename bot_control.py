import streamlit as st
import json
import os
import subprocess
import threading
import time
import psutil
from datetime import datetime

def get_bot_processes():
    """Findet alle laufenden Bot-Prozesse"""
    bot_processes = []
    
    try:
        for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'create_time']):
            try:
                cmdline = proc.info['cmdline']
                if cmdline and len(cmdline) >= 2:
                    if (cmdline[0].endswith('node.exe') or cmdline[0].endswith('node')) and \
                       any('index-advanced.js' in arg or 'index.js' in arg for arg in cmdline):
                        
                        # Bot-Typ bestimmen
                        bot_type = 'advanced' if 'index-advanced.js' in ' '.join(cmdline) else 'basic'
                        
                        bot_processes.append({
                            'pid': proc.info['pid'],
                            'type': bot_type,
                            'start_time': datetime.fromtimestamp(proc.info['create_time']),
                            'cmdline': ' '.join(cmdline)
                        })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
    except Exception as e:
        st.error(f"Fehler beim Scannen der Prozesse: {e}")
    
    return bot_processes

def kill_bot_process(pid):
    """Stoppt einen Bot-Prozess"""
    try:
        proc = psutil.Process(pid)
        proc.terminate()
        
        # Warte auf Beendigung
        try:
            proc.wait(timeout=5)
        except psutil.TimeoutExpired:
            proc.kill()  # Force kill wenn nötig
        
        return True, "Bot erfolgreich gestoppt"
    except psutil.NoSuchProcess:
        return True, "Prozess bereits beendet"
    except Exception as e:
        return False, f"Fehler beim Stoppen: {e}"

def render_bot_control_advanced():
    """Erweiterte Bot-Kontrolle mit Prozess-Monitoring"""
    st.subheader("🤖 Bot Process Manager")
    
    # Aktuelle Bot-Prozesse anzeigen
    bot_processes = get_bot_processes()
    
    if bot_processes:
        st.success(f"🟢 {len(bot_processes)} Bot(s) laufen")
        
        for i, proc in enumerate(bot_processes):
            with st.expander(f"🤖 {proc['type'].title()} Bot (PID: {proc['pid']})", expanded=True):
                col1, col2, col3 = st.columns([2, 2, 1])
                
                with col1:
                    st.write(f"**Typ:** {proc['type']}")
                    st.write(f"**PID:** {proc['pid']}")
                
                with col2:
                    runtime = datetime.now() - proc['start_time']
                    st.write(f"**Laufzeit:** {str(runtime).split('.')[0]}")
                    st.write(f"**Gestartet:** {proc['start_time'].strftime('%H:%M:%S')}")
                
                with col3:
                    if st.button("🛑 Stop", key=f"stop_{proc['pid']}", type="secondary"):
                        success, message = kill_bot_process(proc['pid'])
                        if success:
                            st.success(message)
                            safe_rerun()
                        else:
                            st.error(message)
                
                # Command Line Info
                st.code(proc['cmdline'], language="bash")
    else:
        st.info("🔴 Keine Bot-Prozesse laufen")
    
    # Bot starten Buttons
    st.markdown("---")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("🚀 Advanced Bot starten", type="primary", use_container_width=True):
            # Speichere Konfiguration vor Start
            config_manager = ConfigManager()
            config_manager.save_config(st.session_state.config)
            
            process, success, message = start_bot("advanced")
            if success:
                st.success(message)
                time.sleep(1)  # Kurz warten damit Prozess erscheint
                safe_rerun()
            else:
                st.error(message)
    
    with col2:
        if st.button("⚡ Basic Bot starten", type="secondary", use_container_width=True):
            config_manager = ConfigManager()
            config_manager.save_config(st.session_state.config)
            
            process, success, message = start_bot("basic")
            if success:
                st.success(message)
                time.sleep(1)
                safe_rerun()
            else:
                st.error(message)
    
    with col3:
        if st.button("🛑 Alle Bots stoppen", type="secondary", use_container_width=True):
            stopped_count = 0
            for proc in bot_processes:
                success, _ = kill_bot_process(proc['pid'])
                if success:
                    stopped_count += 1
            
            if stopped_count > 0:
                st.success(f"{stopped_count} Bot(s) gestoppt")
                safe_rerun()
            else:
                st.info("Keine Bots zu stoppen")

def render_system_monitor():
    """System-Monitoring"""
    st.subheader("📊 System Monitor")
    
    # CPU und RAM
    col1, col2, col3 = st.columns(3)
    
    with col1:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        st.metric("CPU Usage", f"{cpu_percent:.1f}%")
    
    with col2:
        memory = psutil.virtual_memory()
        st.metric("RAM Usage", f"{memory.percent:.1f}%")
    
    with col3:
        disk = psutil.disk_usage(os.getcwd())
        st.metric("Disk Usage", f"{disk.percent:.1f}%")
    
    # Node.js Prozesse
    node_processes = []
    try:
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            if proc.info['name'] and 'node' in proc.info['name'].lower():
                node_processes.append(proc.info)
    except:
        pass
    
    if node_processes:
        st.write(f"**Node.js Prozesse:** {len(node_processes)}")
        
        # Als Tabelle anzeigen
        import pandas as pd
        df = pd.DataFrame(node_processes)
        st.dataframe(df, use_container_width=True)

# Safe rerun für alle Module
def safe_rerun():
    try:
        st.rerun()
    except AttributeError:
        try:
            st.experimental_rerun()
        except AttributeError:
            st.warning("Bitte Seite manuell neu laden (F5)")

# Import für main module
if __name__ == "__main__":
    st.error("Dieses Modul sollte nicht direkt ausgeführt werden. Verwende config_editor.py")

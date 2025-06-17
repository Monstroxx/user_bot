import subprocess
import os
import sys

def safe_bot_start():
    """Sicherer Bot-Start für Testing"""
    try:
        print("=== SAFE BOT START TEST ===")
        print(f"Working Directory: {os.getcwd()}")
        print(f"Python Version: {sys.version}")
        
        # Test Node.js
        try:
            result = subprocess.run(["node", "--version"], capture_output=True, text=True, timeout=5)
            print(f"Node.js Version: {result.stdout.strip()}")
            if result.returncode != 0:
                print("ERROR: Node.js not working properly")
                return False
        except Exception as e:
            print(f"ERROR: Node.js test failed: {e}")
            return False
        
        # Check files
        files_to_check = ["index-advanced.js", "config-advanced.json", "package.json"]
        for file in files_to_check:
            if os.path.exists(file):
                print(f"[OK] {file} exists")
            else:
                print(f"[ERROR] {file} missing")
                return False
        
        # Check node_modules
        if os.path.exists("node_modules"):
            print("[OK] node_modules exists")
        else:
            print("[ERROR] node_modules missing - run 'npm install'")
            return False
        
        # Try safe bot start
        print("[INFO] Starting bot safely...")
        process = subprocess.Popen(
            ["node", "index-advanced.js"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        )
        
        print(f"Bot started with PID: {process.pid}")
        
        # Wait and check
        import time
        time.sleep(2)
        
        if process.poll() is None:
            print("[SUCCESS] Bot is running successfully!")
            
            # Let it run for a few seconds then stop
            time.sleep(3)
            process.terminate()
            print("[INFO] Bot stopped for safety")
            return True
        else:
            stdout, stderr = process.communicate()
            print("[ERROR] Bot stopped immediately")
            print(f"Exit code: {process.returncode}")
            if stdout:
                print(f"Stdout: {stdout[:500]}")
            if stderr:
                print(f"Stderr: {stderr[:500]}")
            return False
            
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    success = safe_bot_start()
    if success:
        print("\n[SUCCESS] SAFE BOT START TEST PASSED")
    else:
        print("\n[FAILED] SAFE BOT START TEST FAILED")
    
    input("Press Enter to close...")

import sys
import json
import pandas as pd
import asyncio
from playwright.async_api import async_playwright

# ==========================================
# CONFIGURATION VARIABLES
# ==========================================
# Set the exact name of the column in your Excel/CSV that holds the scenario steps
SCENARIO_COLUMN_NAME = "Script" 
ACTION_DICT_FILE = "actions.json"

async def run_test(target_file):
    print(f"Loading test scenarios from: {target_file}")
    
    # 1. Load the Action Dictionary (Your JSON)
    try:
        with open(ACTION_DICT_FILE, 'r') as f:
            action_dict = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: '{ACTION_DICT_FILE}' not found. Please create it first.")
        return

    # 2. Load the Excel/CSV File
    try:
        if target_file.endswith('.csv'):
            df = pd.read_csv(target_file)
        else:
            df = pd.read_excel(target_file)
    except Exception as e:
        print(f"❌ Error loading '{target_file}': {e}")
        return

    if SCENARIO_COLUMN_NAME not in df.columns:
        print(f"❌ Error: Column '{SCENARIO_COLUMN_NAME}' not found in the file.")
        return

    # 3. Initialize Playwright Browser
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()
        
        print("\n🚀 Starting Test Execution...\n" + "="*40)
        
        # 4. Iterate and Execute
        for index, row in df.iterrows():
            scenario_name = str(row[SCENARIO_COLUMN_NAME]).strip()
            
            # Skip empty rows or headers that don't map to actions
            if not scenario_name or scenario_name.lower() == 'nan':
                continue
                
            print(f"▶️ Executing: {scenario_name}")
            
            if scenario_name in action_dict:
                commands = action_dict[scenario_name]
                for cmd in commands:
                    # --- THE ASYNC EXECUTION WRAPPER ---
                    # Dynamically wraps your JSON strings in an async function 
                    # so the 'await' keyword executes correctly in Python.
                    func_code = f"async def dynamic_run(page):\n    {cmd}"
                    
                    try:
                        exec(func_code, globals(), locals())
                        await locals()['dynamic_run'](page)
                    except Exception as e:
                        print(f"\n❌ DEFECT FOUND at step: '{scenario_name}'")
                        print(f"   Command that failed: {cmd}")
                        print(f"   Error Details: {e}")
                        await browser.close()
                        sys.exit(1) # Stops execution immediately upon defect
            else:
                # If a string from Excel isn't in JSON, it just skips it. 
                # This is useful if your Excel has descriptive rows you want ignored.
                print(f"   ⚠️ Ignored: '{scenario_name}' not in JSON dictionary.")
        
        print("\n" + "="*40 + "\n✅ Test Execution Completed Successfully!")
        await browser.close()

if __name__ == "__main__":
    # Ensure the user provided a filename argument
    if len(sys.argv) < 2:
        print("Usage: python runner.py <your_scenario_file.xlsx>")
        sys.exit(1)
        
    file_arg = sys.argv[1]
    asyncio.run(run_test(file_arg))

# Flashly Setup Guide

Follow these steps to get your specific instance of Flashly up and running.

## 1. Create a Supabase Project

1. Go to [database.new](https://database.new) and create a new project.
2. Wait for the database to start.

## 2. Run Database Schema

1. In your Supabase dashboard, go to the **SQL Editor** (icon on the left sidebar).
2. Click **New Query**.`
3. Copy the entire content of the provided `schema.sql` file.
4. Paste it into the query editor and click **Run**.
   - This will create the necessary tables, enable Row Level Security (RLS), and set up the policies.
5. **Enable Realtime**:
   - In the Supabase dashboard, go to the **Database** -> **Replication** section.
   - Click on the **supavisor_realtime** (or standard) publication and make sure the `decks` and `cards` tables are included in the publication (toggle them on).
   - This is required for the live update feature to work across different windows/devices.

## 3. Configure Authentication

1. Go to **Authentication** -> **Providers** in the Supabase dashboard.
2. Ensure **Email** is enabled.
3. (Optional) Disable "Confirm email" if you want to log in immediately without verifying email:
   - Go to **Authentication** -> **URL Configuration** (or **Providers** -> **Email** settings depending on Supabase version).
   - Turn off **Confirm email**.
   - If you keep it on, you must verify your email before logging in.

## 4. Connect the App

1. Go to **Project Settings** -> **API**.
2. Copy the **Project URL** and **anon public key**.
3. Open `script.js` in your code editor.
4. Replace the placeholders at the top of the file:
   ```javascript
   const supabaseUrl = 'https://grgcynxsmanqfsgkiytu.supabase.co';
   const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZ2N5bnhzbWFucWZzZ2tpeXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDkxMDQsImV4cCI6MjA4NjEyNTEwNH0.rlTuj58kCkZqb_nIGQhCeBkvFeY04FtFx-SLpwXp-Yg';
   ```

## 5. Run the Application

Since this is a vanilla JS app, you can simply open `index.html` in your browser.

However, for better experience (and to avoid CORS issues with some local file imports if we were using modules, though we are using a simple script tag here), it's recommended to use a local server.

If you have Python installed:
```bash
python3 -m http.server
```
Then open `http://localhost:8000`.

## 6. Import CSV Cards (How to Test)

1. Create a CSV file named `biology.csv` (or use any name).
2. Add content in this format (no headers needed, or headers will be ignored if "Front,Back"):
   ```csv
   Mitochondria,Powerhouse of the cell
   Nucleus,Control center of the cell
   Mitosis,Process of cell division
   "Complex Question, with comma","Answer with comma, inside quotes"
   ```
3. Use the "Import from CSV" button in the Deck View to upload it.

Enjoy learning!

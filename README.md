# WhatsApp ChatGPT Bot

This project provides a production-ready WhatsApp bot integrated with ChatGPT (GPT-4) for intelligent customer interactions.

## Requirements
- Node.js >=14
- npm or yarn

## Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   WHATSAPP_NUMBER=whatsapp:+1234567890      # Twilio sandbox or business number
   SANDBOX_JOIN_CODE=your_twilio_sandbox_join_code  # e.g. join\_code from Twilio Sandbox
   PORT=4000
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX=5
   CHAT_TONE=default
   PROFILE=default
   ```
4. **Serve QR code for easy connect/disconnect**
   - The UI will show a QR code (כש"Connect to WhatsApp" מסומן), שבריצת ראשונה יאפשר למשתמש לסרוק את הקוד ולהצטרף ל-Sandbox באמצעות WhatsApp.
   - אפשר לסרוק את קוד ה"STOP" כדי להתנתק.
   - אין צורך בהגדרות נוספות.

5. Configure your WhatsApp webhook (Twilio or Cloud API) to point to:
   `http://<YOUR_HOST>:4000/webhook`

## Testing
You can simulate conversation locally with:
```bash
npm test
```

## File Structure
```
├── config.json          # Bot configuration (tones, profiles, rate limits)
├── src/
│   ├── main.js          # Express server and webhook handler
│   ├── gptService.js    # OpenAI GPT-4 integration
│   ├── whatsapp.js      # Twilio WhatsApp integration
│   ├── sessionManager.js# In-memory session store
│   └── logger.js        # Logging setup with Winston
├── tester.js            # Local testing tool
├── package.json         # Project metadata and dependencies
└── .gitignore           # Files to ignore
```

## Configuration
- Define chat tones and profiles in `config.json`.
- Use `CHAT_TONE` and `PROFILE` environment variables to switch context.

## Security
- Store all API keys in `.env`.
- Rate limiting per phone number protects against spam.

Feel free to extend with Redis for persistent sessions, more tones, or further security features.

## Editing the Conversation Script

הלקוח יכול לעדכן את תסריט השיחה ישירות מתוך הממשק הוובי, ללא צורך בידע בתכנות:

1. התחבר לממשק:
   - פתח את הדפדפן וגש ל־`http://localhost:4000` (או לכתובת ה-Netlify).
   - הזן שם משתמש: `haim` וסיסמה: `elinor1234` ולחץ **Login**.

2. פתח את עורך התסריט:
   - לחץ על הכפתור **ערוך תסריט שיחה** הנמצא מעל צ'אט הממשק.
   - ייפתח חלון טקסט (Textarea) עם התסריט הנוכחי.

3. עדכן את הטקסט:
   - ערוך את התסריט כפי שאתה רוצה, הוסף או הסר טריגרים, תשובות או נקודות מפתח.
   - השינויים נשמרים אוטומטית לתוך הקובץ `scriptGuidelines.txt` בשרת.

4. שמור וסגור:
   - לאחר העריכה, לחץ על **שמור תסריט**.
   - תופיע הודעת אישור שהשינויים נשמרו.
   - לחץ על **בטל** (או חזור לצ'אט) כדי לחזור לממשק הראשי.

5. בדיקת התסריט:
   - עכשיו תוכל לשלוח הודעות בצ'אט ולראות שהבוט עונה עפ"י התסריט המעודכן.

> הטיפ: לפני עדכון חשוב לוודא שהמחרוזות מסודרות ונקיות משגיאות הקלדה כדי שה־AI יבין ויפעל כראוי. 
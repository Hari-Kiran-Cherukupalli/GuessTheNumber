# 🚀 Deployment Guide

This guide covers how to deploy the Guess The Number game on various platforms.

## 📁 Project Structure

```
GuessTheNumber/
├── app.py                 # Flask backend server
├── requirements.txt       # Python dependencies
├── index.html            # Main game interface
├── script.js             # Frontend game logic
├── background-music.js   # Music management
├── styles.css            # Game styling
├── README.md             # Project documentation
├── DEPLOYMENT.md         # This file
└── .gitignore           # Git ignore rules
```

## 🌐 Deployment Options

### Option 1: GitHub Pages (Frontend Only)

**⚠️ Note:** GitHub Pages only hosts static files, so you'll need a separate backend service.

1. **Create GitHub Repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Guess The Number game"
   git branch -M main
   git remote add origin https://github.com/yourusername/guess-the-number.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / (root)
   - Save

3. **Deploy Backend Separately:**
   - Use Heroku, Railway, or Render for the Flask backend
   - Update `apiUrl` in `script.js` to point to your backend URL

### Option 2: Heroku (Full Stack)

1. **Create `Procfile`:**
   ```
   web: python app.py
   ```

2. **Update `app.py` for Heroku:**
   ```python
   import os
   # At the bottom of app.py, replace:
   app.run(debug=True, host='0.0.0.0', port=5000)
   # With:
   port = int(os.environ.get('PORT', 5000))
   app.run(debug=False, host='0.0.0.0', port=port)
   ```

3. **Deploy:**
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

### Option 3: Railway (Recommended)

1. **Connect GitHub Repository:**
   - Go to [Railway.app](https://railway.app)
   - Create new project from GitHub repo
   - Railway auto-detects Python and deploys

2. **Environment Setup:**
   - No additional configuration needed
   - Railway automatically installs requirements.txt
   - Provides HTTPS URL

### Option 4: Render

1. **Create `render.yaml`:**
   ```yaml
   services:
     - type: web
       name: guess-the-number
       env: python
       buildCommand: pip install -r requirements.txt
       startCommand: python app.py
   ```

2. **Deploy:**
   - Connect GitHub repo to Render
   - Auto-deploys on git push

### Option 5: Local Network Play

1. **Find Your IP Address:**
   ```bash
   # Windows
   ipconfig
   # Look for IPv4 Address
   
   # Mac/Linux
   ifconfig
   # Look for inet address
   ```

2. **Update Frontend:**
   ```javascript
   // In script.js, change apiUrl to:
   this.apiUrl = 'http://YOUR_IP_ADDRESS:5000/api';
   ```

3. **Start Servers:**
   ```bash
   # Terminal 1: Backend
   python app.py
   
   # Terminal 2: Frontend
   python -m http.server 8080
   ```

4. **Share with Friends:**
   - Give them: `http://YOUR_IP_ADDRESS:8080`

## 🔧 Production Optimizations

### Security Headers (Add to `app.py`):
```python
@app.after_request
def after_request(response):
    response.headers.add('X-Content-Type-Options', 'nosniff')
    response.headers.add('X-Frame-Options', 'DENY')
    response.headers.add('X-XSS-Protection', '1; mode=block')
    return response
```

### Database (Optional):
```python
# Replace in-memory games dict with:
import sqlite3
# Or use PostgreSQL for production
```

### Environment Variables:
```python
import os
from flask import Flask

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key')
```

## 📱 Mobile Optimization

The game is already mobile-responsive with:
- Touch-friendly buttons
- Responsive grid layout
- Proper viewport settings
- Scrollable interface

## 🎵 Audio Compatibility

Background music works on:
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)
- ⚠️ iOS requires user interaction to start audio

## 🚀 Quick Deploy Commands

### Railway (Fastest):
```bash
git add .
git commit -m "Deploy to Railway"
git push origin main
# Connect repo at railway.app
```

### Heroku:
```bash
echo "web: python app.py" > Procfile
git add .
git commit -m "Deploy to Heroku"
heroku create your-app-name
git push heroku main
```

### GitHub Pages + Backend:
```bash
# Deploy frontend to GitHub Pages
git add .
git commit -m "Deploy frontend"
git push origin main

# Deploy backend separately (Railway/Heroku)
# Update apiUrl in script.js
```

## 🔍 Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Ensure `Flask-CORS` is installed
   - Check `CORS(app)` is in `app.py`

2. **Audio Not Playing:**
   - User must interact with page first
   - Check browser audio permissions

3. **Connection Errors:**
   - Verify backend URL in `script.js`
   - Check firewall settings for local deployment

4. **Mobile Issues:**
   - Ensure viewport meta tag is present
   - Test touch interactions

Choose the deployment option that best fits your needs! 🎉 
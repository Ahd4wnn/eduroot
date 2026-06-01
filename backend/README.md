# eduroot API

## Local setup
```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill in .env values from Supabase dashboard
uvicorn app.main:app --reload --port 8000
```

## API docs (dev only)
http://localhost:8000/docs

## Deployment on Hostinger VPS (Ubuntu)
```bash
# Install dependencies
sudo apt update && sudo apt install python3-pip python3-venv nginx -y

# Clone and setup
cd /var/www/eduroot-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run with gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 --daemon

# Nginx config at /etc/nginx/sites-available/eduroot-api
# (generated in Prompt 10 — deployment)
```

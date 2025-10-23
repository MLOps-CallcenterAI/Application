from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from requests import post

load_dotenv()

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

MODEL_API_URL = os.getenv('MODEL_API_URL')

@app.get('/')
def index():
    return render_template('index.html')

@app.post('/api/prompt')
def prompt():
    data = request.get_json()
    prompt = data['prompt']
    response = post(MODEL_API_URL, json={'prompt': prompt})
    return jsonify(response.json()), response.status_code

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
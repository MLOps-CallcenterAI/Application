import os

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from requests import post

load_dotenv()

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

# Update this to match your actual API endpoint
MODEL_API_URL = os.getenv("MODEL_API_URL")


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/prompt")
def prompt():
    data = request.get_json()
    prompt_text = data["prompt"]

    # Call your actual model API
    response = post(MODEL_API_URL + "/predict_one", json={"text": prompt_text})
    print(response.json())
    if response.status_code == 200:
        return jsonify(response.json()), 200
    else:
        return (
            jsonify(
                {
                    "error": "Failed to process request",
                    "input": prompt_text,
                    "prediction": "Unknown",
                }
            ),
            response.status_code,
        )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

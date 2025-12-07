import os

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from requests import get, post

load_dotenv()

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

# Update to use the Router Agent API
ROUTER_AGENT_URL = os.getenv("ROUTER_AGENT_URL", "http://localhost:8000")


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/prompt")
def prompt():
    data = request.get_json()
    prompt_text = data["prompt"]

    try:
        # Call the Router Agent API
        response = post(
            f"{ROUTER_AGENT_URL}/predict",
            json={"text": prompt_text, "metadata": {"source": "web"}},
            timeout=30,
        )

        if response.status_code == 200:
            result = response.json()

            # Transform the response to match frontend expectations
            formatted_response = {
                "input": prompt_text,
                "prediction": result.get("predicted_category", "Unknown"),
                "confidence": result.get("confidence", 0.0),
                "model_used": result.get("model_used", "unknown"),
                "reasoning": result.get("reasoning", ""),
                "complexity_score": result.get("complexity_score", 0.0),
                "processing_time": result.get("processing_time", 0.0),
                "complexity_details": result.get("complexity_details", {}),
            }

            return jsonify(formatted_response), 200
        else:
            return (
                jsonify(
                    {
                        "error": "Failed to process request",
                        "input": prompt_text,
                        "prediction": "Unknown",
                        "model_used": "none",
                        "confidence": 0.0,
                    }
                ),
                response.status_code,
            )
    except Exception as e:
        return (
            jsonify(
                {
                    "error": f"Connection error: {str(e)}",
                    "input": prompt_text,
                    "prediction": "Unknown",
                    "model_used": "none",
                    "confidence": 0.0,
                }
            ),
            503,
        )


@app.get("/api/health")
def health():
    """Check if the Router Agent is healthy"""
    try:
        response = get(f"{ROUTER_AGENT_URL}/health", timeout=5)

        if response.status_code == 200:
            return jsonify({"status": "healthy", "agent": response.json()}), 200
        else:
            return (
                jsonify({"status": "unhealthy", "error": "Agent not responding"}),
                503,
            )

    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 503


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

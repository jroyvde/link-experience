# app.py
import os
import json
from flask import Flask, request, jsonify, render_template

import vertexai
from vertexai.generative_models import GenerativeModel

app = Flask(__name__, static_folder='static', template_folder='templates')

try:
    credentials_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    if not credentials_path:
        raise ValueError("GOOGLE_APPLICATION_CREDENTIALS environment variable not set.")

    with open(credentials_path, 'r') as f:
        credentials_info = json.load(f)
        project_id = credentials_info['project_id']

    # THE FIX: Changed location to the Tokyo region
    vertexai.init(project=project_id, location="asia-northeast1")

    model = GenerativeModel("gemini-2.5-flash")
    print(f"Successfully initialized Vertex AI for project: {project_id} in region: asia-northeast1")

except Exception as e:
    print(f"Error initializing Vertex AI: {e}")
    print("Please ensure your GOOGLE_APPLICATION_CREDENTIALS variable is set correctly.")

# ... (the rest of the file is the same) ...

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/translate.html')
def index():
    return render_template('translate.html')

# The top of your app.py file stays the same...

@app.route('/translate', methods=['POST'])
def translate_text():
    """
    Handles the translation request from the frontend using the new, detailed prompt.
    """
    data = request.get_json()
    # Note: We no longer need 'target_language'. We only need the recognized text.
    if not data or 'text' not in data:
        return jsonify({'error': 'Invalid request. "text" is required.'}), 400

    recognized_text = data['text']

    # THE CORE CHANGE: Using your powerful new prompt
    prompt = f"""
I want you to act as a translator. I will speak to you in any language and you will detect the language, translate it and answer in the corrected and improved version of my text, in English and Japanese with bullet points. Keep the meaning same. I want you to only reply the correction, the improvements and nothing else, do not write explanations. Do you understand?

My text is: "{recognized_text}"
"""

    try:
        response = model.generate_content(prompt)
        translated_text = response.text
        return jsonify({'translated_text': translated_text.strip()})

    except Exception as e:
        print(f"An error occurred during translation: {e}")
        return jsonify({'error': 'Failed to translate text.'}), 500

# The bottom of your app.py file stays the same...
if __name__ == '__main__':
    app.run(debug=True, port=5000)

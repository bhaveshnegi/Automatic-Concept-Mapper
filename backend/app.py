from flask import Flask, request, jsonify
from nlp_processor import extract_mindmap
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

@app.route("/", methods=['GET'])
def home():
    return "<h2>MindMapr API is running. POST text to /mindmap</h2>"

@app.route('/mindmap', methods=['POST'])
def mindmap():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    text = data['text']
    result = extract_mindmap(text)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)

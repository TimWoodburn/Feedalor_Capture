# app/routes/decoders_api.py
from flask import Blueprint, jsonify, request
from app.plugins.registry import decoders
from app.utils.logger import log_info, log_error

bp = Blueprint("decoders_api", __name__)

@bp.route("/feeds/test-decoder", methods=["POST"])
def test_decoder():
    data = request.json
    url = data.get("url")
    decoder_name = data.get("decoder_name")

    if not url or not decoder_name:
        return jsonify({"error": "Missing url or decoder_name."}), 400

    if decoder_name not in decoders:
        return jsonify({"error": f"Decoder '{decoder_name}' not found."}), 400

    try:
        DecoderClass = decoders[decoder_name]
        metadata = DecoderClass.get_metadata(url)
        return jsonify({"metadata": metadata}), 200
    except Exception as e:
        log_error(f"[DECODERS API] Test failed: {e}")
        return jsonify({"error": str(e)}), 500

'''
@bp.route("/decoders", methods=["GET"])
def list_decoders():
    return jsonify({"decoders": list(decoders.keys())}), 200
'''

@bp.route("/decoders", methods=["GET"])
def list_decoders():
    return jsonify(sorted(decoders.keys())), 200

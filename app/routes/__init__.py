# app/routes/__init__.py

from app.routes.feeds_api import bp as feeds_api_bp
from app.routes.capture_api import bp as capture_api_bp
from app.routes.decoders_api import bp as decoders_api_bp
from app.routes.system_api import bp as system_api_bp
from app.routes.engineering import bp as engineering_bp
from app.routes.frontend import bp as frontend_bp
from app.routes.gridview import bp as gridview_bp


def register_blueprints(app):
    app.register_blueprint(feeds_api_bp, url_prefix="/api")
    app.register_blueprint(capture_api_bp, url_prefix="/api")
    app.register_blueprint(decoders_api_bp, url_prefix="/api")
    app.register_blueprint(system_api_bp, url_prefix="/api")
    app.register_blueprint(engineering_bp)
    app.register_blueprint(frontend_bp)
    app.register_blueprint(gridview_bp)




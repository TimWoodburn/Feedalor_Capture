'''
from flask import Flask
from app.models.external_feed import db
from app.plugins.registry import register_decoders
from app.utils import logger  # Ensure logger is initialized early




def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////app/db/externalfeeds.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    #app.register_blueprint(feed_api_bp)

    with app.app_context():
        db.create_all()
        register_decoders()

    from app.routes import register_blueprints
    register_blueprints(app)

    from app.routes.frontend import bp as frontend_bp
    app.register_blueprint(frontend_bp) 
    
    # Engineering Page
    from app.routes.engineering import bp as engineering_bp
    app.register_blueprint(engineering_bp)


    return app

'''

# app/__init__.py
from flask import Flask
from app.models import db
from app.routes import register_blueprints
from app.plugins.registry import register_decoders

def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")
    


    db.init_app(app)

    register_decoders()        # deferred plugin registration
    register_blueprints(app)  # modular API blueprint registration

    return app




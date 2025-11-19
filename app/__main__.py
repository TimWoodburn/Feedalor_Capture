from app import create_app
from app.tasks.dispatcher import start_dispatcher

app = create_app()
start_dispatcher()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)

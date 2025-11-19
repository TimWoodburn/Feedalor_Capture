# config.py
import os

class Config:
    DEBUG = True
    SECRET_KEY = os.getenv("SECRET_KEY", "dev")
    SQLALCHEMY_DATABASE_URI = "sqlite:////app/db/externalfeeds.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

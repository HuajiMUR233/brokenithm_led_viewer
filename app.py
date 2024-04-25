# -*- coding: utf8 -*-
import json
import mmap
import time
import threading

from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO

app = Flask(__name__, static_url_path="/static")
socketio = SocketIO(app)

socket_connected = False

@app.route("/")
def index():
    return render_template("index.html", air=True, ground=True)


@app.route("/air")
def air():
    return render_template("index.html", air=True, ground=False)


@app.route("/ground")
def ground():
    return render_template("index.html", air=False, ground=True)


@app.route("/config")
def config():
    with open("config.json", "r", encoding="utf8") as f:
        config = json.load(f)
        return jsonify(config)


@socketio.on("connect")
def on_connect():
    global socket_connected
    socket_connected = True
    threading.Thread(target=air_task).start()
    threading.Thread(target=led_task).start()


@socketio.on("disconnect")
def on_ping():
    global socket_connected
    socket_connected = False


def air_task():
    priv_air_data = None
    while socket_connected:
        with mmap.mmap(0, 1024, "Local\\BROKENITHM_SHARED_BUFFER", mmap.ACCESS_READ) as mmap_file:
            mmap_file.seek(0)
            air_data = mmap_file.read(6)
            if air_data != priv_air_data:
                priv_air_data = air_data
                socketio.emit("air", air_data)
        time.sleep(0.01)


def led_task():
    priv_led_data = None
    while socket_connected:
        with mmap.mmap(0, 1024, "Local\\BROKENITHM_SHARED_BUFFER", mmap.ACCESS_READ) as mmap_file:
            mmap_file.seek(6 + 32)
            led_data = mmap_file.read(32*3)
            if led_data != priv_led_data:
                priv_led_data = led_data
                socketio.emit("led", led_data)
        time.sleep(0.01)


if __name__ == "__main__":
    socketio.run(app)

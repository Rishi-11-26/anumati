"""
Tiny Antigravity adapter implemented on top of Flask.
This provides a minimal API with route decorator, middleware and template rendering so the codebase can reference "antigravity".
"""
from flask import Flask, request, redirect, make_response
from functools import wraps


class Antigravity(Flask):
    def __init__(self, import_name):
        super().__init__(import_name, static_folder='static', template_folder='templates')

    def run(self, host='127.0.0.1', port=8000, debug=False):
        super().run(host=host, port=port, debug=debug)


def Request():
    return request


def require_json(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not request.is_json:
            return make_response(('Invalid content type', 400))
        return f(*args, **kwargs)
    return wrapper

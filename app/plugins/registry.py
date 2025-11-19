import os
import importlib
import inspect
from app.plugins.interface import DecoderInterface

decoders = {}

def register_decoders():
    global decoders
    if decoders:  # already initialized, seems hacky way of doing this.#todo 
        return
    decoders.clear()
    plugin_dir = os.path.dirname(__file__)
    
    for fname in os.listdir(plugin_dir):
        if fname.endswith('.py') and fname not in ('__init__.py', 'interface.py', 'registry.py'):
            mod_name = f'app.plugins.{fname[:-3]}'
            mod = importlib.import_module(mod_name)

            for _, obj in inspect.getmembers(mod, inspect.isclass):
                if issubclass(obj, DecoderInterface) and obj is not DecoderInterface:
                    name = getattr(obj, "decoder_name", None)
                    decode_fn = getattr(obj, "decode", None)
                    
                    if name and callable(decode_fn):
                        decoders[name] = obj  # ✅ Store the class
                        print(f"[+] Registered decoder: {name}")

def get_decoder_by_name(name):
    return decoders.get(name)
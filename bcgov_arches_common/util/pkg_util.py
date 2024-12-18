import os
import json


def get_mapbox_spec_files():
    root_dir = os.path.dirname(__file__)
    map_specs = []

    for dir_path, dir_names, filenames in os.walk(
        os.path.join(root_dir, "..", "pkg", "map_layers")
    ):
        for filename in filenames:
            if filename.lower().endswith(".json"):
                spec_filename = os.path.join(dir_path, filename)
                with open(spec_filename, "r") as f:
                    try:
                        name = json.loads(f.read())["name"]
                        map_specs.append({"name": name, "path": spec_filename})
                    except:
                        print("Unable to load %s" % spec_filename)
    return map_specs

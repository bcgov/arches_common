from django.apps import AppConfig
from django.conf import settings

from arches.settings_utils import generate_frontend_configuration


class ArchesCommonConfig(AppConfig):
    name = "bcgov_arches_common"
    is_arches_application = False

    def ready(self):
        if settings.APP_NAME.lower() == self.name:
            generate_frontend_configuration()

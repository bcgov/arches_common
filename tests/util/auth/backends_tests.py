from bcgov_arches_common.util.auth.backends import BCGovRemoteUserBackend
from django.test import TestCase


class TestCleanUsername(TestCase):
    def test_clean_username(self):
        remote_user_backend = BCGovRemoteUserBackend()
        self.assertEqual(
            remote_user_backend.clean_username("SOME_USERNAME"), "some_username"
        )
        self.assertEqual(
            remote_user_backend.clean_username("idir\SOME_USERNAME"), "some_username"
        )
        self.assertEqual(
            remote_user_backend.clean_username("IDIR\SOME_USERNAME"), "some_username"
        )

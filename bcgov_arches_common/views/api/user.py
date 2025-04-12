from http import HTTPStatus

from arches.app.utils.betterJSONSerializer import JSONSerializer
from arches.app.utils.response import JSONErrorResponse, JSONResponse
from arches.app.views.api import APIBase


class UserView(APIBase):
    http_method_names = ["get"]

    def get(self, request):
        l = request.user.groups.values_list("name", "id")
        groups = dict(list(l))
        if not request.user.is_active:
            return JSONErrorResponse(
                title=_("Login required"),
                message=_("This account is no longer active."),
                status=HTTPStatus.FORBIDDEN,
            )

        # N.B.: SetAnonymousUser middleware provides an anonymous User,
        # so don't infer from a 200 OK (or even is_authenticated, if we
        # later serialize that) that you have an authenticated user.
        return JSONResponse(
            JSONSerializer().serialize(
                {
                    "first_name": request.user.first_name,
                    "last_name": request.user.last_name,
                    "username": request.user.username,
                    "groups": groups,
                },
            )
        )

import re
from django_hosts import patterns, host

host_patterns = patterns(
    "",
    host(
        re.sub(r"_", r"-", r"bcgov_arches_common"),
        "bcgov_arches_common.urls",
        name="bcgov_arches_common",
    ),
)

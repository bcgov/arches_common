import Cookies from 'js-cookie';
import type { Ref } from 'vue';
import { type ResourceSearchResults } from '@/bcgov_arches_common/types.ts';

// @todo Initialize these from sever API call?
export const arches = {
    prefix: 'http://localhost/',
    context_root: '',
    urls: {
        api_login: '',
        api_logout: '',
        api_user: '/api/user/',
        api_search: '',
        dropdown: '/concepts/dropdown',
        paged_dropdown: '/concepts/paged_dropdown',
        api_concepts_for_node: '/api/concepts_for_node',
        api_bulk_disambiguated_resource_instance:
            '/api/bulk_disambiguated_resource_instance',
        api_card: '/cards/',
        api_get_frontend_i18n_data: '/api/get_frontend_i18n_data',
        api_node_value: '/api/node_value/',
        api_search_component_data: '/search_component_data/',
        api_tiles: '/api/tiles/',
        api_user_incomplete_workflows: '/api/user_incomplete_workflows',
        user_profile_manager: '/user',
        get_node_config: '/api/node_config',
        api_relatable_resources: '/resource/related/relatable',
    },
};

export function setUrlPrefix(prefix: string) {
    arches.prefix = prefix.replace(/\/$/, '');
}

export function setUrlContextRoot(context_root: string) {
    arches.context_root =
        '/' + context_root.replace(/\/$/, '').replace(/^\//, '');
}

export function formatUrl(url: string) {
    return (
        arches.prefix +
        (url.startsWith(arches.context_root) ? '' : arches.context_root) +
        url
    );
}

export function getToken() {
    const token = Cookies.get('csrftoken');
    if (!token) {
        throw new Error('Missing csrftoken');
    }
    return null;
}

export const fetchUser = async () => {
    const response = await fetch(formatUrl(arches.urls.api_user));
    const parsed = await response.json();
    if (!response.ok) throw new Error(parsed.message || response.statusText);
    return parsed;
};

export const fetchSearchResults = async (
    searchTerm: string,
    items: number,
    page: number,
) => {
    const params = new URLSearchParams({
        term: searchTerm,
        items: items.toString(),
        page: page.toString(),
    });

    const url = formatUrl(`${arches.urls.api_search}?${params.toString()}`);
    const response = await fetch(url);
    const parsed = await response.json();
    if (!response.ok) throw new Error(parsed.message || response.statusText);
    return parsed;
};

export const getConceptsForNode = function (
    graphSlug: string,
    nodeAlias: string,
    concepts: Ref,
) {
    fetch(
        formatUrl(
            `${arches.urls.api_concepts_for_node}/${graphSlug}/${nodeAlias}`,
        ),
    )
        .then((response) => response.json())
        .then((data) => (concepts.value = data));
};

export const fetchConcepts = function (concept_id: string, concepts: Ref) {
    const params = new URLSearchParams({
        conceptid: concept_id,
    });
    fetch(formatUrl(`${arches.urls.paged_dropdown}?${params.toString()}`))
        .then((response) => response.json())
        .then((data) => (concepts.value = data.results));
};

const getNodeConfig = async function (
    graphSlug: string,
    nodeAlias: string,
): Promise<Response> {
    return fetch(
        formatUrl(`${arches.urls.get_node_config}/${graphSlug}/${nodeAlias}`),
    ).then((urlResponse) => urlResponse.json());
};

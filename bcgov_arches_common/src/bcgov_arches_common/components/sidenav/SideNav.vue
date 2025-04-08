<script setup lang="ts">
import { ref } from 'vue';
import { useGettext } from 'vue3-gettext';
import { type RouteNamesType } from '@/bcgov_arches_common/routes.ts';
import { type PropType } from 'vue';

const props = defineProps({
    routeNames: {
        type: Object as PropType<RouteNamesType>,
        required: true,
    },
});

const { $gettext } = useGettext();

const items = ref([
    {
        icon: 'fa fa-home',
        routeName: props.routeNames.home,
        linkName: $gettext('Home'),
    },
]);
</script>

<template>
    <aside class="sidenav">
        <div
            v-for="item in items"
            :key="item.routeName"
        >
            <RouterLink
                v-tooltip="item.linkName"
                :to="{ name: item.routeName }"
                class="p-button p-component p-button-primary"
                style="text-decoration: none"
            >
                <i
                    :class="item.icon"
                    aria-hidden="true"
                ></i>
            </RouterLink>
        </div>
    </aside>
</template>

<style scoped>
.sidenav {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 3rem;
    border-right: 1px solid var(--p-menubar-border-color);
    background: var(--p-panel-background);
}

.p-button,
.p-button:hover {
    min-height: 3rem;
    min-width: 3rem;
    border-radius: 0;
    font-size: 1.5rem;
    color: var(--p-primary-color);
}

@media screen and (max-width: 960px) {
    .sidenav {
        display: none;
    }
}
</style>

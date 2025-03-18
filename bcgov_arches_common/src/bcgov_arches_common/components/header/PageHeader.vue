<script setup lang="ts">
import { ref } from 'vue';
import { useGettext } from 'vue3-gettext';
import { type PropType } from 'vue';

import Menubar from 'primevue/menubar';

import type { RouteNamesType } from '@/bcgov_arches_common/routes.ts';

const props = defineProps({
    routeNames: {
        type: Object as PropType<RouteNamesType>,
        required: true,
    },
    systemName: {
        type: String,
        required: true,
    },
});

import UserInteraction from '../user/UserInteraction.vue';

const { $gettext } = useGettext();

const items = ref([
    // {
    //     label: $gettext("Advanced Search"),
    //     icon: "fa fa-file",
    //     name: routeNames.root,
    // },
]);
const logoUrl = new URL(
    '../../assets/img/logo/BCID_H_rgb_rev.png',
    import.meta.url,
).href;
</script>

<template>
    <nav
        class="v5-splash-navbar navbar"
        role="navigation"
    >
        <Menubar
            class="page-header"
            :model="items"
        >
            <template #start>
                <RouterLink
                    :to="{ name: props.routeNames.home }"
                    style="text-decoration: none; color: inherit"
                >
                    <div class="relative nav-brand-container">
                        <div class="navbar-brand-v5-icon-container">
                            <a
                                href="https://www2.gov.bc.ca/gov/content/home"
                                target="BCGov Home"
                            >
                                <img
                                    class="navbar-brand-v5-icon"
                                    :src="logoUrl"
                                    alt="BC Government Logo"
                                />
                            </a>
                            <h1>{{ $gettext(props.systemName) }}</h1>
                        </div>
                        <div class="application-name"></div>
                    </div>
                </RouterLink>
                <!--            <SearchDialog />-->
            </template>
            <template #item="{ item }">
                <RouterLink
                    :to="{ name: item.name }"
                    class="p-button p-component p-button-primary"
                    style="text-decoration: none"
                >
                    <i
                        :class="item.icon"
                        aria-hidden="true"
                    ></i>
                    <span>{{ item.label }}</span>
                </RouterLink>
            </template>
            <template #end>
                <UserInteraction />
            </template>
        </Menubar>
    </nav>
    <!--  <header>-->
    <!--    <nav class="v5-splash-navbar navbar" role="navigation">-->
    <!--      <div class="container-fluid">-->
    <!--        <div class="navbar-header">-->
    <!--          <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#myNavbar" aria-expanded="false" aria-controls="myNavbar">-->
    <!--            <span class="sr-only">Toggle navigation</span>-->
    <!--            <span class="icon-bar"></span>-->
    <!--            <span class="icon-bar"></span>-->
    <!--            <span class="icon-bar"></span>-->
    <!--          </button>-->

    <!--          <div class="relative nav-brand-container">-->
    <!--            <div class="navbar-brand-v5-icon-container">-->
    <!--              <a href="https://www2.gov.bc.ca/gov/content/home" target="BCGov Home">-->
    <!--                <img class="navbar-brand-v5-icon" src="/bc-fossil-management/static/img/logo/BCID_H_rgb_rev.png" alt="BC Government Logo">-->
    <!--              </a>-->
    <!--              <h1>BC Fossil Management System</h1>-->
    <!--            </div>-->
    <!--            <div class="application-name">-->
    <!--            </div>-->
    <!--          </div>-->
    <!--        </div>-->

    <!--        <div id="myNavbar" class="navbar-collapse collapse">-->
    <!--          <ul class="nav navbar-nav navbar-right">-->
    <!--            <li>-->
    <!--              <a href="#info-block-1">About</a>-->
    <!--            </li>-->

    <!--            <li>-->
    <!--              <a href="/bc-fossil-management/search">Search Fossils</a>-->
    <!--            </li>-->
    <!--            <li>-->
    <!--              <a href="/bc-fossil-management/resource" target="_blank">Manage</a>-->
    <!--            </li>-->

    <!--            <li>-->
    <!--              <a class="auth-welcome" href="/bc-fossil-management/user">-->
    <!--                Welcome,  Brett-->
    <!--              </a>-->
    <!--            </li>-->

    <!--          </ul>-->
    <!--        </div>-->
    <!--      </div>-->
    <!--    </nav>-->
    <!--  </header>-->
</template>

<style scoped>
.page-header {
    border-radius: 0;
    background: unset;
    margin-top: 0;
    margin-bottom: 0;
    padding-bottom: 0;
    padding-top: 0;
}

@media screen and (max-width: 960px) {
    :deep(.p-menubar-button) {
        display: none !important;
    }
}
</style>

<style>
a.p-button,
a.p-button:hover {
    background: none;
    border: none;
    font-size: 1.1em;
}
</style>

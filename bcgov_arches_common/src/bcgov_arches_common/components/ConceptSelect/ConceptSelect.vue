<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue';
import { getConceptsForNode } from '@/bcgov_arches_common/api.ts';
import Select from 'primevue/select';
import { type SelectChangeEvent } from 'primevue/select';

const model = defineModel<string | number | Array<string | number>>();
const props = defineProps({
    graphSlug: { type: String, required: true },
    nodeAlias: { type: String, required: true },
    id: { type: String, required: true },
    placeholder: { type: String, default: 'Select an option' },
});

const emit = defineEmits(['valueUpdated']);

const options = ref([]);

const conceptSelectField = useTemplateRef('conceptSelectField');

// const getLabelForOption = function (optionId: string) {
//     return options.value.find((option) => option.id === optionId)?.text;
// };

onMounted(() => {
    getConceptsForNode(props.graphSlug, props.nodeAlias, options);
});

const valueUpdated = function (event: SelectChangeEvent) {
    emit('valueUpdated', event.value, conceptSelectField);
};

// defineExpose(getLabelForOption);
</script>

<template>
    <Select
        ref="conceptSelectField"
        v-model="model"
        :input-id="props.id"
        option-label="text"
        option-value="id"
        :placeholder="props.placeholder"
        :options="options"
        aria-describedby="legislative-act-help"
        aria-required="true"
        fluid
        class="w-full md:w-14rem"
        size="small"
        @change="valueUpdated"
    />
</template>

<style scoped></style>

<style></style>

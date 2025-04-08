<script setup lang="ts">
import { onMounted, ref, type PropType, type Ref, useTemplateRef } from 'vue';
import { getConceptsForNode } from '@/bcgov_arches_common/api.ts';
import Select from 'primevue/select';

const props = defineProps({
    graphSlug: { type: String, required: true },
    nodeAlias: { type: String, required: true },
    modelValue: { type: Object as PropType<Ref>, required: true },
    id: { type: String, required: true },
    placeholder: { type: String, default: 'Select an option' },
});

const emit = defineEmits(['valueUpdated']);

const options = ref([]);

const conceptSelectField = useTemplateRef('conceptSelectField');

onMounted(() => {
    getConceptsForNode(props.graphSlug, props.nodeAlias, options);
});

const valueUpdated = function (newValue: Object) {
    emit('valueUpdated', newValue, conceptSelectField.value);
};
</script>

<template>
    <Select
        :id="props.id"
        v-model="props.modelValue"
        ref="conceptSelectField"
        option-label="text"
        option-value="id"
        :placeholder="props.placeholder"
        :options="options"
        aria-describedby="legislative-act-help"
        aria-required="true"
        fluid
        class="w-full md:w-14rem"
        @update:model-value="valueUpdated"
        @value-change="valueUpdated"
    />
</template>

<style scoped></style>

<style></style>

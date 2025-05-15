<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { getConceptsForNode } from '@/bcgov_arches_common/api.ts';
import RadioButton from 'primevue/radiobutton';
import RadioButtonGroup from 'primevue/radiobuttongroup';

const model = defineModel<string | number>();
const props = defineProps({
    graphSlug: { type: String, required: true },
    nodeAlias: { type: String, required: true },
    id: { type: String, required: true },
    placeholder: { type: String, default: 'Select an option' },
    groupDirection: { type: String, default: 'column' },
});

const emit = defineEmits(['valueUpdated']);

const options = ref([]);

const valueUpdated = function (event: Event) {
    emit('valueUpdated', (event.target as HTMLButtonElement)?.value, event.target);
};

const flexDirection = computed(() => {
    return props.groupDirection === 'column' ? 'flex-col' : 'flex-row gap-2';
});

onMounted(() => {
    getConceptsForNode(props.graphSlug, props.nodeAlias, options);
});
</script>

<template>
    <RadioButtonGroup
        v-model="model"
        name="id"
        :class="['flex flex-wrap', flexDirection]"
    >
        <div
            v-for="option in options"
            :key="option.id"
            class="flex items-center gap-2"
        >
            <RadioButton
                v-model="model"
                :input-id="option.id"
                name="dynamic"
                :value="option.id"
                variant="filled"
                size="small"
                @change="valueUpdated"
            />
            <label :for="option.id">{{ option.text }}</label>
        </div>
    </RadioButtonGroup>
</template>

<style scoped></style>

<style></style>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps({
    label: { type: String, default: '' },
    showDeleteButton: { type: Boolean, default: true },
    displayValues: { type: Array<String>, required: true },
    deleteCallback: { type: Function, required: true },
});

const displayValues = ref(props.displayValues);
watch(
    () => props.displayValues,
    () => {
        displayValues.value = props.displayValues;
    },
    { immediate: true },
);
</script>

<template>
    <div class="labelled-input flex flex-col gap-2">
        <label>{{ props.label }} ({{ displayValues.length }})</label>
        <div
            v-for="(value, index) in displayValues"
            key="value"
        >
            <div>
                <div
                    class="item-index"
                    style="display: inline-block"
                >
                    {{ index + 1 }}
                </div>
                <div style="display: inline-block">
                    <slot
                        :value="value"
                        :index="index"
                    ></slot>
                </div>
                <i
                    class="fa fa-trash-can item-delete-button"
                    aria-hidden="true"
                    @click="props.deleteCallback(index)"
                ></i>
            </div>
        </div>
    </div>
</template>

<style scoped>
.item-delete-button {
    margin-left: 0.5rem;
    color: blue;
    cursor: pointer;
}
.item-index {
    margin-right: 0.5rem;
    min-width: 2rem;
}
</style>

<style></style>

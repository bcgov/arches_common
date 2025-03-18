<script setup lang="ts">
import Button from 'primevue/button';
import { computed } from 'vue';

const props = defineProps({
    stepNumber: { type: Number, default: 1 },
    showNext: { type: Boolean, default: true },
    validateFn: { type: Function, default: null },
    nextLabel: { type: String, default: 'Next' },
    validateReverse: { type: Boolean, default: false },
    showPrevious: { type: Boolean, default: true },
    previousLabel: { type: String, default: 'Previous' },
});

const emit = defineEmits(['previousClick', 'nextClick']);

const proceedBlocked = computed(() => {
    return !props.validateFn ? false : !props.validateFn(props.stepNumber);
});

const reverseBlocked = computed(() => {
    return !props.validateReverse || !props.validateFn
        ? false
        : props.validateFn(props.stepNumber);
});

const clickNext = () => {
    console.log(`Trying to emit nextClick with ${props.stepNumber + 1}`);
    emit('nextClick');
    return true;
};
</script>

<template>
    <div class="stepper-nav-panel">
        <Button
            v-if="props.showPrevious"
            :label="props.previousLabel"
            :disabled="reverseBlocked"
            class="previous-button"
            severity="secondary"
            @click="$emit('previousClick', props.stepNumber - 1)"
        >
        </Button>
        <div v-if="!props.showPrevious">&nbsp;</div>
        <Button
            v-if="props.showNext"
            :label="props.nextLabel"
            :disabled="proceedBlocked"
            class="next-button"
            @click="clickNext"
        >
        </Button>
    </div>
</template>

<style scoped></style>

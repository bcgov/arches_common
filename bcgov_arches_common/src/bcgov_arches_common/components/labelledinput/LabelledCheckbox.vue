<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
    label: { type: String, default: '' },
    hint: { type: String, default: '' },
    required: { type: Boolean, default: false },
    inputName: { type: String, default: '' },
    errorMessage: { type: String, default: '' },
});
import Message from 'primevue/message';

const isRequired = computed(() => {
    return 'form-label' + (props.required ? ' required' : '');
});
</script>

<template>
    <div class="flex flex-row gap-2">
        <div style="display: inline-block">
            <slot></slot>
        </div>
        <label
            style="display: inline-block"
            :for="props.inputName"
            :class="isRequired"
            >{{ props.label }}</label
        >
    </div>
    <Message
        class="label-message"
        severity="secondary"
        >{{ props.hint }}</Message
    >
    <Message
        class="label-message"
        severity="error"
        >{{ props.errorMessage }}</Message
    >
</template>

<style scoped>
label.required::before {
    color: red;
    content: '*';
    padding-right: 0.1rem;
    //margin-left: 0.5rem;
    //position: absolute;
    //left: -5px;
}

.labelled-input > label {
    display: block;
    max-width: 100%;
    margin-bottom: 0;
    font-weight: 500;
    font-size: 0.8rem;
    margin-top: 1rem;
}
</style>

<style>
.label-message > .p-message-content {
    padding: 0 0.5rem;
    font-size: 0.6rem;
    background: var(--p-panel-background);
    border: none;
}

.p-message.label-message {
    outline-style: none;
    box-shadow: none;
}

.label-message .p-message-text {
    font-size: 0.6rem !important;
}

.p-message-secondary {
    background: unset;
}
</style>

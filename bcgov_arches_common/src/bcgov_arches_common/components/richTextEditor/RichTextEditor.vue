<script setup>
import { ref, computed } from 'vue';
import { ClassicEditor, Essentials, Paragraph, Bold, Italic } from 'ckeditor5';
import { Ckeditor } from '@ckeditor/ckeditor5-vue';

import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-premium-features/ckeditor5-premium-features.css';

const data = ref( '<p>Hello world!</p>' );

const config = computed( () => {
    return {
        licenseKey: '<YOUR_LICENSE_KEY>', // Or 'GPL'.
        plugins: [ Essentials, Paragraph, Bold, Italic ],
        toolbar: [ 'undo', 'redo', '|', 'bold', 'italic', '|', 'formatPainter' ]
    };
} );
</script>

<template>
  <ckeditor
      v-model="data"
      :editor="ClassicEditor"
      :config="config"
  />
</template>

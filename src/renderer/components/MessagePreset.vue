<template>
  <div class="flex items-center gap-2 p-3 rounded shadow w-full mt-3 transition-colors duration-150" :class="{
    'bg-zinc-100 hover:bg-zinc-200 cursor-pointer': !isEditing,
    'bg-zinc-100': isEditing
  }" @click="onClickBox()">
    <div class="flex-1">
      <template v-if="isEditing">
        <input v-model="editedMessage" class="w-full text-sm p-1 border border-gray-300 rounded" />
      </template>
      <template v-else>
        <p class="text-sm text-gray-800 m-0">{{ message }}</p>
      </template>
    </div>

    <button class="p-1 bg-blue-600 text-white rounded hover:bg-blue-500" @click="toggleEdit">
      <component :is="isEditing ? CheckIcon : PencilIcon" class="w-4 h-4" />
    </button>

    <button class="p-1 bg-red-600 text-white rounded hover:bg-red-500" @click.stop="$emit('delete', messageInput)">
      <XMarkIcon class="w-4 h-4" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import { PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/vue/24/solid';

defineOptions({
  name: 'MessagePreset',
});

export interface Props {
  messageInput: string;
}


const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'input', value: string): void;
  (e: 'select', value: string): void;
  (e: 'delete', value: string): void;
}>();


function onClickBox() {
  if (isEditing.value) return;
  emit('select', message.value);
}

const isEditing = ref(false);
const message = ref(props.messageInput);
const editedMessage = ref(props.messageInput);

// Atualiza `message` quando a prop muda externamente
watch(
  () => props.messageInput,
  (newValue) => {
    message.value = newValue;
    editedMessage.value = newValue;
  }
);

function toggleEdit() {
  if (isEditing.value) {
    message.value = editedMessage.value;
    emit('input', editedMessage.value);
  } else {
    editedMessage.value = message.value;
  }
  isEditing.value = !isEditing.value;
}
</script>

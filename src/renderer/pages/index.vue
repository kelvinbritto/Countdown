<template>
  <div class="main-container flex flex-col bg-zinc-700">
    <div class="flex flex-row justify-between p-1 gap-2 items-center">
      <navigation :selected-tab="tab" />
      <div class="flex-1"></div>
      <s-button v-if="tab === 'remote'" class="self-end" @click="save">
        Save
      </s-button>
      <card class="bg-white self-end p-0">
        <button class="block" type="button" @click="openURL('https://cvm.it')">
          <img class="h-10" alt="CVM Logo" src="../assets/images/logo.png" />
        </button>
      </card>
    </div>
    <div v-if="tab === 'main'" class="countdown-tab p-1">
      <div class="flex gap-2 max-h-[340px]">
        <card class="clock-setup justify-center">
          <div class="uppercase text-white">Set</div>
          <time-input @update:modelValue="timerControl.set($event);" :modelValue="update.setSeconds" color="white" />
          <div class="uppercase mt-2 text-white flex flex-row justify-between">
            <span>Count</span>
            <div class="flex flex-row items-center gap-1">
              <play-pause-icon v-if="update.timerEndsAt" class="w-6 h-6 inline-flex" />
              <span>{{ update.timerEndsAt }}</span>
            </div>

          </div>
          <time-input :modelValue="update.countSeconds" color="green" :disabled="true" />
          <div class="uppercase mt-2 text-white">Extra</div>
          <time-input color="red" :modelValue="update.extraSeconds" :disabled="true" />
        </card>
        <card class="control-buttons">
          <s-button class="text-4xl mb-2 font-mono uppercase" @click="timerControl.start">Start</s-button>
          <s-button :disabled="update.isReset" class="text-4xl mb-2 font-mono uppercase" type="warning"
            @click="timerControl.toggle">
            {{ update.isRunning ? "Pause" : "Resume" }}
          </s-button>
          <s-button class="text-4xl mb-2 font-mono uppercase" type="danger" @click="onResetClick">
            Reset
          </s-button>
          <div class="flex gap-2 justify-center">
            <jog @up-click="jogMinutes(1)" @down-click="jogMinutes(-1)">
              <template v-slot:up>
                <plus-icon class="w-5 h-5 inline-flex"></plus-icon>
              </template>
              <template v-slot:down>
                <minus-icon class="w-5 h-5 inline-flex"></minus-icon>
              </template>
              1m
            </jog>
            <jog @up-click="jogMinutes(5)" @down-click="jogMinutes(-5)">
              <template v-slot:up>
                <plus-icon class="w-5 h-5 inline-flex"></plus-icon>
              </template>
              <template v-slot:down>
                <minus-icon class="w-5 h-5 inline-flex"></minus-icon>
              </template>
              5m
            </jog>
            <jog @up-click="jogMinutes(10)" @down-click="jogMinutes(-10)">
              <template v-slot:up>
                <plus-icon class="w-5 h-5 inline-flex"></plus-icon>
              </template>
              <template v-slot:down>
                <minus-icon class="w-5 h-5 inline-flex"></minus-icon>
              </template>
              10m
            </jog>
          </div>
        </card>

        <card class="overflow-y-scroll rounded p-2">
          <div class="flex items-center gap-1 mb-1">
            <span class="uppercase text-white">Message</span>
          </div>

          <!-- Campo de entrada -->
          <div class="flex gap-2 mb-2">
            <input-with-button :is-live="isLive" type="text" @input="value => message = value" :model-value="message"
              @click="sendMessage">
              Send
            </input-with-button>
          </div>

          <div class="flex gap-2 mb-2">
            <button @click="addOrMoveMessageToFront(message)"
              class="flex-1 p-1 bg-green-600 text-white rounded hover:bg-green-500 text-xs">
              Add Preset
            </button>
            <button @click="deleteMessage" class="flex-1 p-1 bg-red-600 text-white rounded hover:bg-red-500 text-xs">
              Clear
            </button>
          </div>

          <message-preset v-for="(msg, index) in messages" :key="index" :messageInput="msg" @select="onSelectPreset"
            @delete="onDeletePreset" />
        </card>
      </div>
      <card class="presets inline-flex gap-2 overflow-x-auto">
        <s-button v-for="(preset, index) in settings.presets" :key="index" type="info" @click="setPresetTime(preset)">
          {{ preset }}
        </s-button>
      </card>
    </div>
    <settings-tab v-if="tab === 'settings'" :screens="screens" :selected-screen="selectedScreen"
      @settings-updated="settingsUpdated" />
    <remote-tab v-if="tab === 'remote'" ref="remoteTabRef" />
    <windows-tab :screens="screens" v-if="tab === 'windows'" />
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref } from "vue";
import { ipcRenderer } from 'electron'
import Card from '../components/Card.vue'
import SButton from '../components/SButton.vue'
import TimeInput from '../components/TimeInput.vue'
import SettingsTab from '../components/SettingsTab.vue'
import WindowsTab from "../components/WindowsTab.vue";
import Jog from "../components/Jog.vue";
import { PlayPauseIcon, PlusIcon, MinusIcon, TrashIcon, PaperAirplaneIcon } from '@heroicons/vue/24/outline';
import Navigation from "../components/Navigation.vue";
import { shell } from "electron";
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
dayjs.extend(duration)
import RemoteTab from "../components/RemoteTab.vue";
import { TimerEngineUpdate } from "../../common/TimerInterfaces";
import { TimerControl } from "../TimerControl";
import Display = Electron.Display;
import InputWithButton from "../components/InputWithButton.vue";
import { CountdownSettings, DEFAULT_STORE } from "../../common/config";
import { MessageUpdate } from "../../common/TimerInterfaces";
import MessagePreset from "../components/MessagePreset.vue"
// import {Howl} from "howler";
/*
import { Howl } from "howler";
import gong from "../assets/sounds/gong.mp3";
let sound = new Howl({
  src: [gong],
})
*/

const timerControl = new TimerControl(updateReceived);

defineOptions({
  name: 'index',
});

export interface Props {
  tab: string
}

let messageUpdate = ref<MessageUpdate>({
  message: null,
});

const isLive = computed(() => {

  console.log(messageUpdate.value);

  if (!messageUpdate.value.message) {
    return false
  }
});

const props = defineProps<Props>();

let externalContent = ref('');
let selectedScreen = ref(null);
let screens = ref<Display[]>([]);
let selectedTab = ref('countdown');
let settings = ref<CountdownSettings>(DEFAULT_STORE.defaults.settings);
let audioRun = false;
let update = ref<TimerEngineUpdate>({
  setSeconds: 0,
  countSeconds: 0,
  currentSeconds: 0,
  extraSeconds: 0,
  secondsSetOnCurrentTimer: 0,
  isCountingUp: false,
  isExpiring: false,
  isReset: true,
  isRunning: false,
  timerEndsAt: null,
});
let message = ref('');
let lastMessage = ref('');
const messages = ref<string[]>([]);

messages.value.unshift("Please, Wrap Up!");
messages.value.unshift("Your time is Over");

function sendMessage() {
  timerControl.sendMessage(message.value);
}

function onResetClick(): void {
  timerControl.reset();
  timerControl.sendMessage('');
}

function onSelectPreset(presetMessage: string): void {
  message.value = presetMessage;
}

function onDeletePreset(msgToRemove: string) {
  const index = messages.value.indexOf(msgToRemove);
  if (index !== -1) {
    messages.value.splice(index, 1);
  }
}

function addOrMoveMessageToFront(newMessage: string): void {
  if (typeof newMessage !== 'string' || newMessage == "") return;

  const index = messages.value.indexOf(newMessage);

  if (index !== -1) {
    messages.value.splice(index, 1);
  }

  messages.value.unshift(newMessage);
}

const deleteMessage = () => {
  timerControl.sendMessage('');
  message.value = "";
}

onMounted(async () => {
  settings.value = await ipcRenderer.invoke('settings:get')
  screens.value = await ipcRenderer.invoke('get-screens');

  ipcRenderer.on('screens-updated', async () => {
    screens.value = await ipcRenderer.invoke('get-screens');
  });

  ipcRenderer.on('message', (event, arg) => {
    console.log(arg);
    messageUpdate.value = arg;
  });

  ipcRenderer.on('audio:play', async (event, audioFile, mimeType) => {
    const sound = new Howl({
      src: `data:${mimeType};base64,${audioFile}`,
    });

    sound.play()
  })
});

function jogMinutes(minutes: number) {
  if (!update.value.isReset) {
    timerControl.jogCurrent(minutes * 60);
  } else {
    timerControl.jogSet(minutes * 60);
  }
}

function updateReceived(newUpdate: TimerEngineUpdate) {
  update.value = newUpdate;
}

function setPresetTime(minutes: number) {
  const secondsPerMinute = 60;
  timerControl.set(minutes * secondsPerMinute);
}

async function settingsUpdated() {
  settings.value = await ipcRenderer.invoke('settings:get')
}

function openURL(url: string) {
  shell.openExternal(url);
}

let remoteTabRef = ref<typeof RemoteTab>(null);

function save() {
  nextTick(() => {
    if (props.tab === 'remote') {
      remoteTabRef.value.save()
    }
  })
}
</script>

<style scoped>
.main-container {
  height: 100%;
  gap: 10px;
  padding: 0 10px 10px 10px;
}

.countdown-tab {
  @apply flex flex-col gap-2;
}

.clock-setup {
  @apply flex flex-col min-w-fit
}

.control-buttons {
  @apply flex flex-col;
  min-width: 250px;
}

.presets {}

.top-menu {
  height: 50px;
}
</style>

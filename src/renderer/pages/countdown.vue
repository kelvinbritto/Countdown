<template>
  <div :style="{
    backgroundColor: update.isReset ? settings.colors.resetBackground : backgroundColor,
  }" v-if="settings.contentAtReset === ContentAtReset.Empty && update.isReset" class="drag"></div>

  <div class="drag relative-container">
    <transition name="slide-down">
      <div v-if="messageUpdate.message" class="message-box-float" :class="{
        'message-box': true
      }">
        {{ messageUpdate.message }}
      </div>
    </transition>
  </div>
  <div
    v-if="settings.contentAtReset !== ContentAtReset.Empty || (settings.contentAtReset === ContentAtReset.Empty && !update.isReset)"
    :style="{
      backgroundColor: update.isReset ? settings.colors.resetBackground : backgroundColor,
      ...cssVars
    }" class="flex justify-center flex-col drag">
    <transition name="fade" mode="out-in">
      <div v-if="!update.isRunning" class="fundo">
        <clock-big v-if="showClock" :clock-color="settings.colors.clock" :text-color="settings.colors.clockText"
          :is-big="settings.contentAtReset === ContentAtReset.Time && update.isReset"
          :seconds-on-clock="settings.show.secondsOnClock" :use12-hour-clock="settings.use12HourClock" />
      </div>
      <div v-else class="overlay">
        <div
          v-if="!isBigNumber && settings.show.timer && ((settings.contentAtReset === ContentAtReset.Full && update.isReset) || !update.isReset)"
          class="text-center text-time font-digital-clock" :style="{ color: timerText }" :class="{
            'animate-pulse-fast': !update.isReset && update.isCountingUp && settings.pulseAtZero
          }">
          <span :class="{ grayText: !update.isCountingUp && update.currentSeconds < 600 }"> {{ timerDigits[0] }} </span>
          <span :class="{ grayText: !update.isCountingUp && update.currentSeconds < 60 }">{{ timerDigits[1] }}</span>
          <span :class="{ grayText: !update.isCountingUp }">:</span>
          <span :class="{ grayText: !update.isCountingUp && update.currentSeconds < 10 }">{{ timerDigits[2] }}</span>
          <span class="S2">{{ timerDigits[3] }}</span>
        </div>

        <div
          v-if="isBigNumber && settings.show.timer && ((settings.contentAtReset === ContentAtReset.Full && update.isReset) || !update.isReset)"
          class="text-center text-time font-digital-clock" :style="{ color: timerText }" :class="{
            'animate-pulse-fast': !update.isReset && update.isCountingUp && settings.pulseAtZero
          }">
          <span class="S2">{{ timer }}</span>
        </div>
        <progress-bar
          v-if="settings.show.progress && ((settings.contentAtReset === ContentAtReset.Full && update.isReset) || !update.isReset)"
          :is-expiring="update.isExpiring" :is-counting-up="update.isCountingUp" :is-reset="update.isReset"
          :value="progressBarPercent" />
        <clock v-if="showClock" :clock-color="settings.colors.clock" :text-color="settings.colors.clockText"
          :is-big="settings.contentAtReset === ContentAtReset.Time && update.isReset"
          :seconds-on-clock="settings.show.secondsOnClock" :use12-hour-clock="settings.use12HourClock" />
      </div>
    </transition>
  </div>
</template>


<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { ipcRenderer } from 'electron'
//import { Howl } from 'howler'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import {
  ContentAtReset,
  DEFAULT_WINDOW_SETTINGS,
  WindowSettings
} from "../../common/config";
import { MessageUpdate, TimerEngineUpdate } from "../../common/TimerInterfaces";
import ProgressBar from "../components/ProgressBar.vue";
import Clock from "../components/Clock.vue";
import ClockBig from "../components/ClockBig.vue";
import { IpcGetWindowSettingsArgs } from "../../common/IpcInterfaces";

dayjs.extend(duration)

defineOptions({
  name: 'countdown',
});

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
let messageUpdate = ref<MessageUpdate>({
  message: null,
})
let settings = ref<WindowSettings>(DEFAULT_WINDOW_SETTINGS);

const timer = computed(() => {
  const currentTimeInSeconds = dayjs.duration(Math.abs(update.value.currentSeconds), 'seconds')

  if (settings.value.show.hours) {
    return currentTimeInSeconds.format('HH:mm:ss')
  } else {
    let minutes = String(Math.floor(currentTimeInSeconds.asMinutes())).padStart(2, '0');
    let seconds = String(currentTimeInSeconds.seconds()).padStart(2, '0');

    return `${minutes}:${seconds}`;
  }
});


const timerDigits = computed(() => {
  const currentTimeInSeconds = dayjs.duration(Math.abs(update.value.currentSeconds), 'seconds');

  let minutes: string;
  let seconds: string;

  if (settings.value.show.hours) {
    // Se quiser suportar horas, pode adaptar aqui
    const full = currentTimeInSeconds.format('HH:mm:ss'); // HH:MM:SS
    // pega apenas MMSS
    minutes = full.slice(3, 5); // MM
    seconds = full.slice(6, 8); // SS
  } else {
    minutes = String(Math.floor(currentTimeInSeconds.asMinutes())).padStart(2, '0');
    seconds = String(currentTimeInSeconds.seconds()).padStart(2, '0');
  }

  return [...minutes, ...seconds];
});

const isBigNumber = computed(() => {
  return update.value.currentSeconds > 5400;
});

const showClock = computed(() => {
  if (update.value.isReset) {
    if (settings.value.contentAtReset === ContentAtReset.Time) return true;
    if (settings.value.contentAtReset !== ContentAtReset.Empty && settings.value.show.clock) return true;
  }
  return settings.value.show.clock;
});

const progressBarPercent = computed(() => {
  if (update.value.secondsSetOnCurrentTimer === 0 || update.value.currentSeconds === 0) return 100;
  if (update.value.isCountingUp) return 100;
  return ((update.value.secondsSetOnCurrentTimer - update.value.currentSeconds) * 100 / update.value.secondsSetOnCurrentTimer);
});

const timerText = computed(() => {
  if (update.value.isExpiring) {
    return "oklch(0.795 0.184 86.047)" //YELLOW
  }
  if (update.value.isCountingUp && !update.value.isReset) {
    return "oklch(0.505 0.213 27.518)"
  } else {
    return "oklch(0.871 0.15 154.449)" //GREEN
  }
});

const backgroundColor = computed(() => {
  return settings.value.colors.background;
})

const cssVars = computed(() => {
  return {
    '--message-length': messageUpdate.value.message?.length ?? 1,
    '--magic-number-font-size': 17,
  }
});

const queryString = new URLSearchParams(window.location.search);
const timerId = ref(+queryString.get('timer'))
const windowId = ref(+queryString.get('window'))

onMounted(async () => {

  const args: IpcGetWindowSettingsArgs = {
    timerId: timerId.value,
    windowId: windowId.value,
  }
  settings.value = await ipcRenderer.invoke('settings:get-window', args)

  ipcRenderer.on('update', (event, arg) => {
    update.value = arg;
  })
  ipcRenderer.on('message', (event, arg) => {
    console.log(arg);
    messageUpdate.value = arg;
  })
  ipcRenderer.on('settings:updated', (event, arg) => {
    settings.value = {
      ...settings.value,
      ...arg,
    }
  })
});
</script>

<style scoped>
.drag {
  -webkit-user-select: none;
  -webkit-app-region: drag;
}

.text-time {
  font-size: min(40vh, 25vw);
}

.font-digital-clock {
  font-family: Arial, Helvetica, sans-serif
}

/* TRANSIÇÃO FADE */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

.relative-container {
  position: absolute;
}

.message-box-float {
  position: relative;
  top: 0;
  left: 50%;
  transform: translateX(-50%);

  display: flex;
  justify-content: center;
  /* Centraliza horizontalmente */
  align-items: center;
  /* Centraliza verticalmente */
  text-align: center;
  /* Centraliza linhas múltiplas */
  flex-wrap: wrap;

  padding: 16px 24px;
  max-width: 99%;
  min-height: 20vh;
  background-color: rgba(68, 68, 68, 0.7);
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;

  font-size: clamp(1rem, 11vw, 13vh);
  /* adapta à tela */
  line-height: 1.2;
  word-break: break-word;
}

.message-box {
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
  line-height: 1;
}

/* TRANSIÇÃO SLIDE */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.4s ease;
}

.slide-down-enter-from {
  transform: translate(-50%, -20px);
  opacity: 0;
}

.slide-down-enter-to {
  transform: translate(-50%, 0);
  opacity: 1;
}

.slide-down-leave-from {
  transform: translate(-50%, 0);
  opacity: 1;
}

.slide-down-leave-to {
  transform: translate(-50%, -20px);
  opacity: 0;
}

.grayText {
  color: rgb(50, 50, 50);
}
</style>

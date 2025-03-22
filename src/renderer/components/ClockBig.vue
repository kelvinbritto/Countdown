<script setup lang="ts">
import {ClockIcon} from '@heroicons/vue/24/solid';
import dayjs from "dayjs";
import {onMounted, ref} from "vue";

export interface Props {
  isBig: boolean
  clockColor: string
  textColor: string
  secondsOnClock: boolean
  use12HourClock: boolean
}

const props = defineProps<Props>();


let currentTimeTimerId: NodeJS.Timer = null;
let currentTime = ref(dayjs().format('HH:mm'));
let currentDate = ref(dayjs().format('dddd, DD.MM.YYYY'));
function updateTime() {
  if (props.secondsOnClock && !props.use12HourClock) {
    currentTime.value = dayjs().format('HH:mm');
    currentDate.value = dayjs().format('dddd, DD.MM.YYYY');
  }
}

onMounted(() => {
  if (currentTimeTimerId === null) {
    currentTimeTimerId = setInterval(updateTime, 1000)
  }
})
</script>

<template>
  <div
    class="text-center text-clock"
    :class="{
        'text-clock': !isBig,
        'text-clock-on-reset': isBig
      }"
  >
    <span class="ml-5" :style="{color: textColor}">{{ currentTime }}</span>
  </div>
  <div
  class="text-center text-date"
  >
    <span class="ml-5" :style="{color: textColor}">{{ currentDate }}</span>
  </div>
</template>

<style scoped>
.clock-icon {
  height: min(20vh, 15vw);
  width: min(20vh, 15vw);
}

.clock-icon-on-reset {
  height: min(40vh, 25vw);
  width: min(40vh, 25vw);
}

.text-clock {
  font-size: min(40vh, 30vw);
  font-weight: lighter;
}

.text-date {
  font-size: min(10vh, 10vw);
  font-weight: lighter;
  margin-top: 3vh;
}

.text-clock-on-reset {
  font-size: min(40vh, 25vw);
}
</style>

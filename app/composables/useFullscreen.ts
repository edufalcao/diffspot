import { ref } from 'vue';

const isFullscreen = ref(false);

export function useFullscreen() {
  function toggleFullscreen() {
    isFullscreen.value = !isFullscreen.value;
  }

  function exitFullscreen() {
    isFullscreen.value = false;
  }

  return { isFullscreen, toggleFullscreen, exitFullscreen };
}

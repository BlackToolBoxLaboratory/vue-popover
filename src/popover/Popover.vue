<template>
  <div
    :class="['btb-vue-popover', `popover-${popoverId}`, `popover-align-${computedAlign}`, { 'popover-arrow': props.withArrow }]"
    :style="{ ...getStyle(['btb-vue-list', `popover-align-${computedAlign}`, props.withArrow ? 'popover-arrow' : ''], props.styleObj) }">
    <div ref="refTrigger" class="popover_trigger" :style="{ ...getStyle(['popover_trigger'], props.styleObj) }"
      @click="togglePopover">
      <template v-if="$slots.trigger">
        <slot name="trigger" />
      </template>
      <template v-else>
        {{ 'Trigger' }}
      </template>
    </div>
    <div ref="refContent" :class="['popover_content', { 'content-show': state }, `content-position-${computedPostion}`]"
      :style="{ ...getStyle(['popover_content', `content-position-${computedPostion}`, state ? 'content-show' : ''], props.styleObj) }">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from "vue";
import type { PopoverPosition, PopoverAlign } from '../types';

import { defineComponent, watch, watchPostEffect, onMounted, onUnmounted, computed, ref } from "vue";

import { getStyle } from "../utils/styleMethods";
import getWindowOffset from "../utils/getWindowOffset";

const OFFSET_SCROLLBAR = 20;

export default defineComponent({
  name: "btb-vue-popover",
  props: {
    id: {
      type: String,
      default: function () {
        return `${Date.now()}-${Math.ceil(Math.random() * 1000)}`;
      },
    },
    state: {
      type: Boolean,
    },
    position: {
      type: String as PropType<PopoverPosition>,
      default: 'bottom'
    },
    align: {
      type: String as PropType<PopoverAlign>,
      default: 'begin'
    },
    withArrow: {
      type: Boolean,
      default: function () {
        return true
      },
    },
    autoDetect: {
      type: Boolean,
      default: function () {
        return true
      },
    },
    styleObj: {
      type: Object,
      default: function () {
        return undefined;
      },
    },
  },
  emits: ["update:state", "toggle", "show", "hide"],
  setup(props, { emit }) {
    const popoverId = ref(props.id);
    const state = ref(props.state);
    const autoAdjust = ref({
      position: '',
      align: ''
    });

    const refTrigger = ref();
    const refContent = ref();

    const computedPostion = computed(() => {
      return autoAdjust.value.position || props.position
    })
    const computedAlign = computed(() => {
      return autoAdjust.value.align || props.align
    })

    const _detectX = () => {
      const trigger = refTrigger.value;
      const content = refContent.value;
      const windowOffset_trigger = getWindowOffset(trigger);

      if (windowOffset_trigger.left - content.scrollWidth < 0) {
        if (props.position === 'left') {
          return {
            position: 'right'
          };
        }
        if ((props.position === 'top')
          || (props.position === 'bottom')) {
          return {
            align: 'begin'
          };
        }
      } else if (windowOffset_trigger.left + trigger.scrollWidth + content.scrollWidth + OFFSET_SCROLLBAR > window.innerWidth) {
        if (props.position === 'right') {
          return {
            position: 'left'
          };
        }
        if ((props.position === 'top')
          || (props.position === 'bottom')) {
          return {
            align: 'end'
          };
        }
      }
      return {};
    }

    const _detectY = () => {
      const trigger = refTrigger.value;
      const content = refContent.value;
      const windowOffset_trigger = getWindowOffset(trigger);

      if (windowOffset_trigger.top - content.scrollHeight < 0) {
        if (props.position === 'top') {
          return {
            position: 'bottom'
          };
        }
        if ((props.position === 'left')
          || (props.position === 'right')) {
          return {
            align: 'begin'
          };
        }
      } else if (windowOffset_trigger.top + trigger.scrollHeight + content.scrollHeight + OFFSET_SCROLLBAR > window.innerHeight) {
        if (props.position === 'bottom') {
          return {
            position: 'top'
          };
        }
        if ((props.position === 'left')
          || (props.position === 'right')) {
          return {
            align: 'end'
          };
        }
      }
      return {};
    }

    const _resize = () => {
      if (props.autoDetect) {
        autoAdjust.value = {
          ...autoAdjust.value,
          ..._detectX(),
          ..._detectY()
        };
      }
    }

    const _clickListener = (event) => {
      let result = event.composedPath().find((node) => {
        if (node.classList) {
          return node.classList.value.search(`popover-${popoverId.value}`) > 0;
        }
        return false;
      });
      if (typeof result == 'undefined') {
        togglePopover();
      }
    }

    const togglePopover = () => {
      emit("toggle", !state.value);
      if (state.value) {
        emit("hide");
      } else {
        emit("show");
      }
      emit("update:state", !state.value);
      if(typeof props.state === 'undefined') {
        state.value = !state.value;
      }
    };

    watch(
      () => computedPostion.value,
      (newValue, oldValue) => {
        if (newValue !== oldValue) {
          _resize();
        }
      }
    );

    watch(
      () => computedAlign.value,
      (newValue, oldValue) => {
        if (newValue !== oldValue) {
          _resize();
        }
      }
    );

    watch(
      () => state.value,
      (newValue, oldValue) => {
        window.removeEventListener('click', _clickListener);
        if (newValue) {
          window.addEventListener('click', _clickListener);
        }
        if (state.value !== newValue) {
          state.value = newValue
        }
      }
    );

    watch(
      () => props.state,
      (newValue, oldValue) => {
        state.value = newValue;
      }
    )

    watchPostEffect(() => {
      if (state.value) {
        _resize();
      }
    })

    onMounted(() => {
      _resize();
      window.addEventListener('resize', _resize);
      window.addEventListener('scroll', _resize);
    })

    onUnmounted(() => {
      window.removeEventListener('resize', _resize);
      window.removeEventListener('scroll', _resize);
      window.removeEventListener('click', _clickListener);
    })

    return {
      getStyle,

      refTrigger,
      refContent,
      props,
      popoverId,
      state,
      computedPostion,
      computedAlign,

      togglePopover
    }
  }
})
</script>

<style lang="scss">
.btb-vue-popover {
  position: relative;
  display: inline-flex;
  vertical-align: middle;

  &.popover-arrow {
    .popover_content::before {
      content: '';
    }
  }

  &.popover-align-begin {
    align-items: flex-start;
    justify-content: flex-start;

    &.popover-arrow {

      .content-position-bottom,
      .content-position-top {
        &::before {
          left: 0.25rem;
        }
      }

      .content-position-left,
      .content-position-right {
        &::before {
          top: 0.25rem;
        }
      }
    }
  }

  &.popover-align-center {
    align-items: center;
    justify-content: center;

    &.popover-arrow {

      .content-position-bottom,
      .content-position-top {
        &::before {
          left: calc((100% - 1rem) / 2);
        }
      }

      .content-position-left,
      .content-position-right {
        &::before {
          top: calc((100% - 1rem) / 2);
        }
      }
    }
  }

  &.popover-align-end {
    align-items: flex-end;
    justify-content: flex-end;

    &.popover-arrow {

      .content-position-bottom,
      .content-position-top {
        &::before {
          right: 0.25rem;
        }
      }

      .content-position-left,
      .content-position-right {
        &::before {
          bottom: 0.25rem;
        }
      }
    }
  }

  .popover_trigger {
    cursor: pointer;
    flex-grow: 1;
  }

  .popover_content {
    display: none;
    position: absolute;
    max-width: 15rem;
    background-color: white;
    border-radius: 0.25rem;
    padding: 0.25rem;
    font-size: 1rem;
    z-index: 1;

    &.content-show {
      display: block;
    }

    &::before {
      position: absolute;
      border-style: solid;
    }

    &.content-position-bottom {
      top: 100%;
      margin-top: 0.5rem;

      &::before {
        top: -0.5rem;
        border-color: #fff transparent;
        border-width: 0 0.5rem 0.5rem;
      }
    }

    &.content-position-top {
      bottom: 100%;
      margin-bottom: 0.5rem;

      &::before {
        bottom: -0.5rem;
        border-color: #fff transparent;
        border-width: 0.5rem 0.5rem 0;
      }
    }

    &.content-position-left {
      right: 100%;
      margin-right: 0.5rem;

      &::before {
        right: -0.5rem;
        border-color: transparent #fff;
        border-width: 0.5rem 0 0.5rem 0.5rem;
      }
    }

    &.content-position-right {
      left: 100%;
      margin-left: 0.5rem;

      &::before {
        left: -0.5rem;
        border-color: transparent #fff;
        border-width: 0.5rem 0.5rem 0.5rem 0;
      }
    }
  }
}
</style>
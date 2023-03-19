import type { App } from "vue";

import { PopoverPosition, PopoverAlign } from './types';
import { Popover } from "./popover/index";

export default function install(app: App) {
  app.component(Popover.name, Popover);
};

export {
  PopoverPosition,
  PopoverAlign,

  install,

  Popover,
}


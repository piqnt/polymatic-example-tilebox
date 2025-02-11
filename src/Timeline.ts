// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { Middleware } from "polymatic";

export interface TimelineEvent {
  name: string;
  timeout?: number;
  start(): number;
  update?(dt: number): void;
  finish?(): void;
  cancel?(): void;
}

export interface TimelineContext {
  timeline: TimelineEvent[];
}

export class TimelineManager extends Middleware<TimelineContext> {
  constructor() {
    super();
    this.on("frame-update", this.handleFrameUpdate);
  }

  handleFrameUpdate = ({ dt }: { dt: number }) => {
    if (!this.context.timeline?.length) return;
    const task = this.context.timeline[0];
    if (typeof task.timeout !== "number") {
      task.timeout = task.start();
      if (typeof task.timeout !== "number" || task.timeout < 0) {
        this.context.timeline.shift();
        logTimeline(this.context, 'skip');
        if (task.timeout === 0) task.finish?.();
      }
    }
    task.update?.(dt);
    task.timeout -= dt;
    if (task.timeout <= 0) {
      this.context.timeline.shift();
      logTimeline(this.context, 'finish');
      task.finish?.();
    }
  };
}

export const clearTimeline = (context: TimelineContext) => {
  let task: TimelineEvent;
  while ((task = context.timeline.pop())) {
    task.cancel?.();
  }
  logTimeline(context,'clear');
};

export const queueEvent = (context: TimelineContext, task: TimelineEvent) => {
  context.timeline.push(task);
  logTimeline(context,'queue');
};

let t = performance.now();
const logTimeline = (context: TimelineContext, name: string) => {
  return;
  console.log("timeline", (performance.now() - t) | 0, name, context.timeline?.map((e) => e.name).join(", "));
  t = performance.now();
};

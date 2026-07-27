import * as eaw from 'eastasianwidth';

function getDisplayWidth(text: string): number {
  return eaw.length(text);
}

const TARGET_WIDTH = 70;
const BORDER_LINE = '='.repeat(76);

export function output(text: string): void {
  const textWidth = getDisplayWidth(text);
  const paddingLen = Math.max(0, TARGET_WIDTH - textWidth);
  const padding = ' '.repeat(paddingLen);

  console.log(BORDER_LINE);
  console.log(`‖\x1b[32mlog\x1b[0m ${text}${padding}‖`);
  console.log(BORDER_LINE);
}

export function outputWithoutBorder(text: string): void {
  const textWidth = getDisplayWidth(text);
  const paddingLen = Math.max(0, TARGET_WIDTH - textWidth);
  const padding = ' '.repeat(paddingLen);

  console.log(`‖\x1b[31merr\x1b[0m ${text}${padding}‖`);
}

export function outputBorder(): void {
  console.log(BORDER_LINE);
}

export function outputErr(text: string): void {
  const textWidth = getDisplayWidth(text);
  const paddingLen = Math.max(0, TARGET_WIDTH - textWidth);
  const padding = ' '.repeat(paddingLen);

  console.log(BORDER_LINE);
  console.log(`‖\x1b[31merr\x1b[0m ${text}${padding}‖`);
  console.log(BORDER_LINE);
}

export function outputWarn(text: string): void {
  const textWidth = getDisplayWidth(text);
  const paddingLen = Math.max(0, TARGET_WIDTH - textWidth);
  const padding = ' '.repeat(paddingLen);

  console.log(BORDER_LINE);
  console.log(`‖\x1b[33mwrn\x1b[0m ${text}${padding}‖`);
  console.log(BORDER_LINE);
}

export function outputSus(text: string): void {
  const textWidth = getDisplayWidth(text);
  const paddingLen = Math.max(0, TARGET_WIDTH - textWidth);
  const padding = ' '.repeat(paddingLen);

  console.log(BORDER_LINE);
  console.log(`‖\x1b[34msus\x1b[0m ${text}${padding}‖`);
  console.log(BORDER_LINE);
}

export function outputMultipleLine(textList: string[], logType: 'log' | 'err', extra: string = ""): void {
  console.log(BORDER_LINE);
  if (logType === "log") {
    console.log(`‖\x1b[32mlog\x1b[0m : ${extra}${' '.repeat(68 - getDisplayWidth(extra))}‖`);
    for (const text of textList) {
      const textWidth = getDisplayWidth(text);
      const paddingLen = Math.max(0, 70 - textWidth);
      const padding = ' '.repeat(paddingLen) + ' '.repeat(4);
      console.log(`‖${text}${padding}‖`);
    }
  } else if (logType === "err") {
    console.log(`‖\x1b[31merr\x1b[0m : ${extra}${' '.repeat(68 - getDisplayWidth(extra))}‖`);
    for (const text of textList) {
      const textWidth = getDisplayWidth(text);
      const paddingLen = Math.max(0, 70 - textWidth);
      const padding = ' '.repeat(paddingLen) + ' '.repeat(4);
      console.log(`‖${text}${padding}‖`);
    }
  }
  console.log(BORDER_LINE);
}

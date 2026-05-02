import { defaults } from "./options.js";

const state = {
  selections: { ...defaults },
  isGenerating: false
};

export function getState() {
  return {
    selections: { ...state.selections },
    isGenerating: state.isGenerating
  };
}

export function setSelection(group, value) {
  state.selections[group] = value;
}

export function setGenerating(value) {
  state.isGenerating = value;
}

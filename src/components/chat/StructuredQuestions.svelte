<script lang="ts">
/**
 * StructuredQuestions — The ask_user tool rendered as UI.
 *
 * This is the PRIMARY interaction pattern. Instead of freeform chat,
 * the AI presents clear choices that reduce cognitive load and prevent
 * blank-page paralysis.
 *
 * Based on SPEC_v1.md §4.8.
 */

import type { StructuredQuestion, StructuredResponse } from '@/agents/tools/types';

interface Props {
  questions: StructuredQuestion[];
  onRespond: (response: StructuredResponse) => void;
}

let { questions, onRespond }: Props = $props();

// Track selected values for each question
let selections = $state<Record<number, Set<string>>>({});
let otherText = $state<Record<number, string>>({});

// Initialize selections
$effect(() => {
  questions.forEach((_, idx) => {
    if (!selections[idx]) {
      selections[idx] = new Set();
    }
  });
});

function handleOptionClick(questionIdx: number, value: string, multiSelect: boolean) {
  if (!selections[questionIdx]) {
    selections[questionIdx] = new Set();
  }

  if (!multiSelect) {
    // Single select: replace selection
    selections[questionIdx] = new Set([value]);
  } else {
    // Multi select: toggle
    if (selections[questionIdx].has(value)) {
      selections[questionIdx].delete(value);
    } else {
      selections[questionIdx].add(value);
    }
    selections[questionIdx] = new Set(selections[questionIdx]); // Trigger reactivity
  }
}

function handleSubmit() {
  // For now, just submit the first question's response
  // TODO: Support multi-question submission
  const response: StructuredResponse = {
    questionIndex: 0,
    selected: Array.from(selections[0] || []),
    other: otherText[0],
  };

  onRespond(response);
}

function isSelected(questionIdx: number, value: string): boolean {
  return selections[questionIdx]?.has(value) ?? false;
}

function canSubmit(): boolean {
  // At least one selection required
  return (selections[0]?.size ?? 0) > 0 || !!otherText[0]?.trim();
}
</script>

<div class="space-y-4 rounded-lg border border-amber/30 bg-amber/5 p-4">
  {#each questions as question, idx (idx)}
    <div class="space-y-3">
      <!-- Question Header -->
      {#if question.header}
        <h4 class="font-display text-xs font-semibold uppercase tracking-wide text-amber-dim">
          {question.header}
        </h4>
      {/if}

      <!-- Question Text -->
      <p class="text-sm font-medium text-ink">
        {question.question}
      </p>

      <!-- Options -->
      <div class="space-y-2">
        {#each question.options as option}
          {@const selected = isSelected(idx, option.value ?? option.label)}
          <button
            onclick={() => handleOptionClick(idx, option.value ?? option.label, question.multi_select ?? false)}
            class={`group w-full rounded-lg border px-4 py-3 text-left transition-all duration-200 ${
              selected
                ? 'border-amber bg-amber/10 shadow-sm'
                : 'border-ash bg-cream hover:border-amber/50 hover:bg-stone'
            }`}
          >
            <div class="flex items-start gap-3">
              <!-- Selection indicator -->
              <div
                class={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  selected
                    ? 'border-amber bg-amber'
                    : 'border-ash group-hover:border-amber/50'
                }`}
              >
                {#if selected}
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256" fill="currentColor" class="text-ink">
                    <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/>
                  </svg>
                {/if}
              </div>

              <!-- Label & Description -->
              <div class="flex-1">
                <div class="font-medium text-ink">{option.label}</div>
                {#if option.description}
                  <div class="mt-0.5 text-sm text-graphite">
                    {option.description}
                  </div>
                {/if}
              </div>
            </div>
          </button>
        {/each}

        <!-- "Other" option (always available per spec) -->
        {#if question.allow_other !== false}
          <div class="mt-3">
            <label class="flex flex-col gap-2">
              <span class="text-sm font-medium text-ink">Other (please specify)</span>
              <input
                type="text"
                bind:value={otherText[idx]}
                placeholder="Type your answer..."
                class="rounded-lg border border-ash bg-cream px-3 py-2 text-sm text-ink placeholder-graphite transition-colors focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
              />
            </label>
          </div>
        {/if}
      </div>
    </div>
  {/each}

  <!-- Submit Button -->
  <div class="flex justify-end pt-2">
    <button
      onclick={handleSubmit}
      disabled={!canSubmit()}
      class="rounded-lg bg-amber px-5 py-2.5 text-sm font-medium text-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
    >
      Continue
    </button>
  </div>
</div>
